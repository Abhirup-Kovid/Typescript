// A string literal type is a type consisting of exactly one string.
// It is not `string`. It is a subtype of `string`, and that is the entire
// relationship.

type OrderStatus = "queued" | "brewing" | "served"

let status: OrderStatus = "queued"
status = "brewing"
status = "served"
// status = "cancelled"   ->  TS2322: not assignable to OrderStatus

// One direction only.
const widenMe: string = status                 // ok: the one value fits the set
// const narrowMe: OrderStatus = widenMe        ->  error: `string` might be
//                                                any of a million other strings

// The compiler can autocomplete, exhaustively check, and narrow against
// literal unions. None of that works with plain `string` -- which is the
// whole argument for using them.

type MenuItem = "masala" | "ginger" | "elaichi" | "lemon"

// Paired with Record you get a total mapping, and adding a member to the
// union makes the missing entry a compile error.
const priceInRupees: Record<MenuItem, number> = {
  masala: 20,
  ginger: 25,
  elaichi: 30,
  lemon: 20,
}
// Adding "cardamom" to MenuItem -> TS2741: Property 'cardamom' is missing.

// Exhaustive switch: with no `default` and a `never` return, TypeScript can
// prove the switch handled every case, so `noImplicitReturns` is satisfied
// and nothing is silently dropped.
function assertNever(value: never): never {
  throw new Error(`unhandled: ${value}`)
}

function nextStatus(current: OrderStatus): OrderStatus {
  switch (current) {
    case "queued":
      return "brewing"
    case "brewing":
      return "served"
    case "served":
      return "queued"
    default:
      // current is `never` here: every case already returned.
      return assertNever(current)
  }
}

const statusTemplate: `${OrderStatus}-${number}` = "queued-1"

export { status, nextStatus, priceInRupees, statusTemplate, assertNever }
export type { OrderStatus, MenuItem }
