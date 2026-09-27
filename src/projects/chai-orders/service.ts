// The service layer: a generic in-memory repository plus a state machine,
// which is where generics and discriminated unions earn their keep together.

import {
  orderId,
  type Order,
  type OrderId,
  type OrderStatus,
  type RejectionReason,
  type CustomerId,
} from "./domain.js"
import { price, revenue, type PriceBreakdown } from "./pricing.js"

// ---------------------------------------------------------------------------
// Errors as values, not throws
// ---------------------------------------------------------------------------
// Every method returns a `Result` rather than throwing. The reason is concrete:
// a thrown error is invisible in a signature, so a caller cannot see that
// `get` can fail, and a missed `try` is a runtime bug. A return type says so.
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export type ServiceError =
  | { kind: "not_found"; id: string }
  | { kind: "illegal_transition"; from: OrderStatus; to: OrderStatus }
  | { kind: "duplicate"; id: string }

// `E` is a *union of unions* on a common discriminant, so the consumer can
// switch exhaustively. See src/edges/05 for why `?.` is not a substitute for
// checking `ok`.

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// ---------------------------------------------------------------------------
// A generic repository
// ---------------------------------------------------------------------------
// The constraint is on the *identity* of the stored thing - it must be
// reachable by a key and identifiable by an id. Anything satisfying that works,
// which is why one class serves orders, customers and machines.
export class Repository<T extends { readonly id: string }> {
  // `private` is a compile-time convention, and this project also uses
  // `#private` below to compare them. Neither is a security boundary.
  readonly #items = new Map<string, T>()

  constructor(seed: readonly T[] = []) {
    for (const item of seed) this.#items.set(item.id, item)
  }

  get size(): number {
    return this.#items.size
  }

  // `T | undefined` rather than a throw: "not found" is a normal outcome for
  // a lookup, and encoding it in the return type means every caller has to
  // deal with it.
  find(id: string): T | undefined {
    return this.#items.get(id)
  }

  save(item: T): void {
    this.#items.set(item.id, item)
  }

  has(id: string): boolean {
    return this.#items.has(id)
  }

  // `filter` on an array gives `T[]` because the predicate is not a guard; with
  // a type predicate you would get a narrowed element type. Worth remembering
  // that `filter(Boolean)` does *not* narrow, and that `!` after it is the
  // hole people leave everywhere.
  all(): T[] {
    return [...this.#items.values()]
  }

  by(predicate: (item: T) => boolean): T[] {
    return this.all().filter(predicate)
  }
}

// ---------------------------------------------------------------------------
// The state machine
// ---------------------------------------------------------------------------
// Legal transitions as data, derived from the union rather than hand-listed.
// `satisfies` is doing real work here: it checks the table against the type
// while *keeping* the literal keys, so `next["queued"]` is a precise union
// rather than `OrderStatus`.
const TRANSITIONS = {
  queued: ["brewing", "rejected"],
  brewing: ["ready", "rejected"],
  ready: [],
  rejected: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>

type NextStatus = (typeof TRANSITIONS)[OrderStatus]

// The payoff, and the reason for `as const satisfies` over a bare annotation:
// `OrderStatus -> NextStatus` is now expressible without a cast, because the
// compiler still sees the specific values.
const nextStatus = (from: OrderStatus): NextStatus | undefined => TRANSITIONS[from][0] as NextStatus | undefined

// ---------------------------------------------------------------------------
// The service
// ---------------------------------------------------------------------------
export class OrderService {
  readonly #orders: Repository<Order>

  constructor(seed: readonly Order[] = []) {
    this.#orders = new Repository(seed)
  }

  get count(): number {
    return this.#orders.size
  }

  get(id: OrderId): Result<Order, ServiceError> {
    const found = this.#orders.find(id)
    return found ? ok(found) : err({ kind: "not_found", id })
  }

  place(order: Order): Result<Order, ServiceError> {
    if (this.#orders.has(order.id)) {
      return err({ kind: "duplicate", id: order.id })
    }
    this.#orders.save(order)
    return ok(order)
  }

  // A transition takes the *whole* updated order rather than a patch, because
  // the state change usually brings data that only the new state can hold
  // (`station` on brewing, `shelf` on ready). A `Partial<Order>` argument
  // would be a bag of optionals with no relationship to the state - exactly
  // the modelling mistake the union exists to prevent.
  update(next: Order): Result<Order, ServiceError> {
    const existing = this.#orders.find(next.id)
    if (!existing) return err({ kind: "not_found", id: next.id })

    const legal = (TRANSITIONS[existing.status] as readonly OrderStatus[]).includes(next.status)
    if (!legal) {
      return err({ kind: "illegal_transition", from: existing.status, to: next.status })
    }

    this.#orders.save(next)
    return ok(next)
  }

  // The reason this class is pleasant to use: the `Result` return type means
  // the caller cannot forget the failure branch.
  revenue(): number {
    return revenue(this.#orders.all())
  }

  // Mapping a `Result` to another `Result` - the composable form. Writing it
  // out is fine, but the useful observation is that this is exactly the
  // "or a discriminated union at the boundary" idea from the error-handling
  // note, and that a `map` on a `Result` is a `map` on a *union*, which is why
  // the compiler can check both branches at once.
  priceOf(id: OrderId): Result<PriceBreakdown, ServiceError> {
    const found = this.get(id)
    return found.ok ? ok(price(found.value)) : found
  }

  byCustomer(customer: CustomerId): Order[] {
    return this.#orders.by((order) => order.customer === customer)
  }

  byStatus(status: OrderStatus): Order[] {
    return this.#orders.by((order) => order.status === status)
  }

  reasons(): RejectionReason[] {
    return this.#orders.by((order) => order.status === "rejected").map((order) =>
      order.status === "rejected" ? order.reason : undefined,
    ).filter((r): r is RejectionReason => r !== undefined)
  }
}
