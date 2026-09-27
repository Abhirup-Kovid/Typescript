// The domain vocabulary. Everything else in this project derives from the
// types in this file, so it is worth being precise about which spelling is
// used and why.

import { MENU } from "../../modules/chai-menu.js"

// ---------------------------------------------------------------------------
// A branded type for ids
// ---------------------------------------------------------------------------
// `string` is the most contagious type in a codebase that stores things in
// maps: pass an order id where a customer id is expected and nothing complains,
// because both are strings. Branding makes them nominally distinct while
// remaining a `string` at runtime - zero bytes of cost, and the compiler
// catches the mistake at the call site instead of at the database.
type Brand<T, B extends string> = T & { readonly __brand: B }

export type OrderId = Brand<string, "OrderId">
export type CustomerId = Brand<string, "CustomerId">

export const orderId = (raw: string): OrderId => raw as OrderId
export const customerId = (raw: string): CustomerId => raw as CustomerId

// That `as` is the one honest place for a cast: the brand is a compile-time
// claim about a value that came from outside, so something has to establish
// it, and it is a one-line named function rather than a cast at each use.

// Swapping two ids is now a compile error rather than a wrong query at 3am.
// orderId("o-1")          -> OrderId
// customerId("o-1")       -> CustomerId
// takesOrderId(customerId("c-1"))   // TS2345

// ---------------------------------------------------------------------------
// Literal unions derived from data, not repeated in code
// ---------------------------------------------------------------------------
// Re-exported from the menu module rather than retyped, so the menu and the
// types cannot disagree.
export type CupSize = keyof typeof MENU   // "small" | "medium" | "large"
export type Sugar = 0 | 0.5 | 1 | 1.5 | 2

// `Sugar` is the interesting one: a numeric union. The compiler rejects `2.5`
// and `2.25`, which is a real constraint on domain data that a `number` cannot
// express. Note that `number` is still assignable *to* Sugar, so a value read
// from outside has to be validated - narrowing is the next step, not this file.

export interface Milk {
  readonly kind: "dairy" | "oat" | "none"
}

// ---------------------------------------------------------------------------
// The order, as a state machine
// ---------------------------------------------------------------------------
// The single most valuable modelling decision in the project. An order is one
// of four states, and each state carries only the data that state can have -
// `rejection` cannot exist, and `cancellationReason` cannot exist either,
// because neither is legal in `queued`.
//
// The alternative - one interface with every field optional - compiles
// everywhere, means `order.cancelReason.toUpperCase()` is legal when it is
// nonsense, and encodes the rules in documentation nobody reads.

interface Base {
  readonly id: OrderId
  readonly customer: CustomerId
  readonly size: CupSize
  readonly sugar: Sugar
  readonly milk: Milk
}

export type Order =
  | (Base & { readonly status: "queued"; readonly placedAt: Date })
  | (Base & { readonly status: "brewing"; readonly startedAt: Date; readonly station: 1 | 2 | 3 })
  | (Base & { readonly status: "ready"; readonly readyAt: Date; readonly shelf: string })
  | (Base & { readonly status: "rejected"; readonly reason: RejectionReason; readonly rejectedAt: Date })

export type OrderStatus = Order["status"]   // the union, derived

export type RejectionReason =
  | "out_of_stock"
  | "machine_full"
  | "payment_declined"
  | "too_sugary"

// ---------------------------------------------------------------------------
// Narrowing the union by status
// ---------------------------------------------------------------------------
// `in` narrowing exists for exactly this: the property that only exists on
// some arms becomes a discriminant without needing an explicit tag.
export function rejectionOf(order: Order): RejectionReason | undefined {
  return "reason" in order ? order.reason : undefined
}

export function stationOf(order: Order): 1 | 2 | 3 | undefined {
  return "station" in order ? order.station : undefined
}

// And exhaustiveness, which is the thing that makes adding a fifth state a
// compile error in every place that handled the other four:
export function describe(order: Order): string {
  switch (order.status) {
    case "queued":
      return "waiting to start"
    case "brewing":
      return `brewing on ${order.station}`
    case "ready":
      return `on shelf ${order.shelf}`
    case "rejected":
      return `rejected: ${order.reason}`
    default: {
      const unreachable: never = order
      return unreachable
    }
  }
}
