// The entry point: a typed route table, an order flow, and a deliberate
// demonstration that the compiler catches the mistakes.

import {
  customerId,
  orderId,
  describe,
  rejectionOf,
  type CustomerId,
  type Order,
  type OrderId,
  type OrderStatus,
  type Sugar,
  type CupSize,
  type Milk,
} from "./domain.js"
import { OrderService, type Result, type ServiceError } from "./service.js"
import { price, priceAny, type PriceBreakdown } from "./pricing.js"

// ---------------------------------------------------------------------------
// A typed route table, built from template literal types
// ---------------------------------------------------------------------------
// The same machinery as src/types/08, applied to something real. The point is
// not that a bad string is rejected - it is that the handler's *arguments* are
// derived from the route pattern, so adding a parameter to a path updates the
// handler's type with no manual edit.

type Routes = {
  "/orders": { method: "GET"; handler: () => string }
  "/orders/:id": { method: "GET"; handler: (id: string) => string }
  "/orders/:id/price": { method: "GET"; handler: (id: string) => PriceBreakdown }
  "/customers/:cid/orders": { method: "GET"; handler: (cid: string) => number }
}

type Route = keyof Routes
type Method = Routes[Route]["method"]

// Pull the parameter names out of the path itself.
type Params<P extends string> = P extends `${string}:${infer Rest}`
  ? Rest extends `${infer Name}/${string}`
    ? Name | Params<Rest>
    : Rest
  : never

type ParamsOf<R extends Route> = Params<R>

// The signature: a path, plus one string per parameter the path declares. The
// variadic tuple `ParamsOf<R> extends never ? [] : [string]` is the awkward
// part - `[string]` is a one-element tuple, and rest-parameter syntax turns the
// caller's arguments into it, so a path with a parameter demands exactly one
// string and a path without demands none.
function handle<R extends Route>(path: R, ...args: ParamsOf<R> extends never ? [] : [string]): Routes[R]["handler"] {
  throw new Error("not implemented - the type is the point")
}

// I wrote `handle("/orders/:id/price")` expecting the compiler to complain
// about the *shape* of the path. It complained about the argument count
// instead - TS2554, "Expected 2 arguments, but got 1" - because `Params` is
// working correctly: the path contains `:id`, so the handler takes a string,
// and the string has to be supplied. The error is more useful than the one I
// had predicted, because it is about the call rather than about the route.
//
// The interesting case is a path with *no* parameter, where the variadic tuple
// collapses to `[]` and the handler genuinely takes no arguments:
//   handle("/orders")          // fine, zero extra arguments
//   handle("/orders", "o-1")   // TS2554
// which is the property worth having - the route pattern is the source of
// truth for the handler's arity.
// Called lazily rather than at module scope, because the demo `handle` throws
// by design and a top-level call would abort the file before `console.log`
// runs. The *type* is the lesson here, not the behaviour.
function routeDemo(): void {
  const priceRoute = handle("/orders/:id/price", "o-1")
  void priceRoute
  // handle("/orders/:id/price")       // TS2554: expected 2 arguments, got 1
  // handle("/orders", "o-1")          // TS2554: /orders takes no parameters
  // handle("/orders/42/price", "o-1") // TS2345: not a key of Routes
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const ada: CustomerId = customerId("c-1")
const grace: CustomerId = customerId("c-2")

const milk: Milk = { kind: "oat" }

const queued: Order = {
  id: orderId("o-1"),
  customer: ada,
  size: "medium",
  sugar: 1,
  milk,
  status: "queued",
  placedAt: new Date(0),
}

const brewing: Order = {
  id: orderId("o-2"),
  customer: ada,
  size: "large",
  sugar: 2,
  milk: { kind: "dairy" },
  status: "brewing",
  startedAt: new Date(1),
  station: 2,
}

const rejected: Order = {
  id: orderId("o-3"),
  customer: grace,
  size: "small",
  sugar: 0,
  milk: { kind: "none" },
  status: "rejected",
  reason: "out_of_stock",
  rejectedAt: new Date(2),
}

// The union pays for itself here: this object could not be written against a
// flat interface without every field being optional, and `station` on a
// `queued` order would have been accepted.

// ---------------------------------------------------------------------------
// The flow
// ---------------------------------------------------------------------------
const service = new OrderService([queued, brewing, rejected])

for (const order of [queued, brewing, rejected]) {
  service.place(order)
}

function report(): string[] {
  const lines: string[] = []

  lines.push(`count: ${service.count}`)
  lines.push(`revenue: ${service.revenue()}`)
  lines.push(describe(queued))
  lines.push(describe(brewing))
  lines.push(describe(rejected))
  lines.push(`rejection: ${rejectionOf(rejected) ?? "none"}`)

  // A found order.
  const found = service.get(orderId("o-1"))
  lines.push(found.ok ? describe(found.value) : `error: ${found.error.kind}`)

  // A missing one - the error branch is reachable and the compiler knows the
  // shape of the error, which is the entire payoff of returning `Result`.
  const missing = service.get(orderId("o-999"))
  lines.push(missing.ok ? "impossible" : `error: ${missing.error.kind}`)

  // Mapping to another Result.
  const priced = service.priceOf(orderId("o-2"))
  lines.push(priced.ok ? `${priced.value.total}` : `error: ${priced.error.kind}`)

  // Generics: works on a fixture, not just a domain Order.
  lines.push(String(priceAny({ size: "small" as CupSize, sugar: 2 as Sugar, milk }).total))

  return lines
}

// ---------------------------------------------------------------------------
// Mistake catalogue - all of these are compile errors, and the compiler's
// message is more informative than the comment would be
// ---------------------------------------------------------------------------
// service.get("o-1")                 // TS2345: OrderId, not string
// const s: CupSize = "huge"           // TS2322
// const s: Sugar = 0.25               // TS2322
// describe({ ...queued, station: 1 }) // TS2353: station does not exist on queued
// service.update({ ...queued, status: "ready", shelf: "A" })
//                                     // TS2353: ready needs `shelf`, and
//                                     // queued -> ready is not a legal transition
// const c: OrderId = customerId("c")  // TS2322: CustomerId, not OrderId
// handle("/orders/42/price")          // TS2769: expected 1 arg, got 2
// price("o-1")                        // TS2345: string is not an Order

// ---------------------------------------------------------------------------
// An exhaustive consumer, and a mistake worth recording
// ---------------------------------------------------------------------------
// The first version of this switched on a *separate* `status` parameter while
// re-checking `order.status` in each branch, and ended with
// `const unreachable: never = order`. TS2322 - `Order` is not `never`.
//
// Of course. Exhaustiveness comes from narrowing the value you switch on. The
// `default` branch is reachable whenever the compiler cannot prove the switch
// covered the union, and switching on a different variable means it never
// can. The re-checks were me hedging against exactly the error I should have
// let the compiler find.
//
// The fix is to switch on `order` itself. Then the union narrows, `order`
// becomes `never` in `default`, and the check holds - and it holds *because*
// the modelling is right.
function summary(order: Order): string {
  switch (order.status) {
    case "queued":
      return "new"
    case "brewing":
      return `station ${order.station}`
    case "ready":
      return order.shelf
    case "rejected":
      return order.reason
    default: {
      const unreachable: never = order
      return unreachable
    }
  }
}

// This is the line that justifies the union. Adding a fifth status makes this
// function fail to compile here, rather than at runtime with an `undefined`
// in a log line.

console.log(report(), summary(queued), describe(brewing), rejectionOf(brewing))
export { handle, routeDemo }
export type { Result, ServiceError, OrderId, CustomerId }
