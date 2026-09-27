// Destructuring is not a TypeScript feature. It is JavaScript syntax that the
// compiler understands well enough to give you correctly narrowed types from.
//
// The interesting part is that destructuring *preserves* narrowing, while
// property access does not.

type Order = {
  id: string
  customer: { name: string; email?: string }
  totals: { cups: number; rupees: number }
}

declare const order: Order

// Plain destructuring, with a rename and a default.
const { id, customer: { name } } = order
const { totals: { rupees } } = order

// A default in a destructuring pattern only kicks in for `undefined`, and it
// is what makes the result non-optional. This is the idiomatic way to turn
// `string | undefined` into a usable `string`.
const { email = "no-email-on-file" } = order.customer
// email is now `string` - the union is gone, replaced by the fallback.

// Rest in an object pattern collects the remaining own enumerable keys.
const { id: orderId, ...orderMeta } = order
// orderMeta is typed as { customer: {...}; totals: {...} } - the *rest*
//   type is computed, not a generic Record. That is a real compile-time
//   difference from a hand-written destructure in plain JS.

declare const maybeOrder: Order | undefined

// ---------------------------------------------------------------------------
// The payoff: destructuring collapses a union into its arms automatically
// ---------------------------------------------------------------------------
type Result =
  | { state: "loading" }
  | { state: "success"; data: string }
  | { state: "failed"; reason: string }

declare const result: Result

if (result.state === "success") {
  result.data // string - narrowed via property access, fine
}

// Destructuring does NOT narrow, and on a union it cannot even name the
// non-shared properties. This is a compile error:
//
//   const { state, data, reason } = result
//   -> TS2339: Property 'data' does not exist on type 'Result'.
//              Property 'reason' does not exist on type 'Result'.
//
// Reason: to destructure `data`, the compiler must know the object *has* a
// `data` key on every possible shape. The `Result` union has one arm with no
// `data` at all, so the access is not allowed.
//
// The fix is to narrow first, then destructure. Destructure the discriminant
// to drive the check, or check the discriminant and destructure afterwards:
const { state } = result
console.log(state) // "loading" | "success" | "failed" - nothing was gained

if (result.state === "failed") {
  const { reason: why } = result
  console.log(why) // string
}

if (result.state === "success") {
  const { data: body } = result
  console.log(body) // string
}

// Practical summary:
//   - Destructuring a *single* object type: no narrowing, but great defaults.
//   - Destructuring a *union*: you can only destructure what every arm has.
//     Narrow first, destructure second.

// ---------------------------------------------------------------------------
// Array patterns
// ---------------------------------------------------------------------------
const [first, , third] = [10, 20, 30]
// The hole skips index 1. `first` and `third` are affected by
// noUncheckedIndexedAccess; the hole contributes nothing to the tuple length
// in TS's accounting beyond the declared arity.

let a = 1
let b = 2
;[a, b] = [b, a]
// Note the leading semicolon. Without it, a line starting with `[` is parsed
// as an index into whatever came before. This is a genuine footgun of
// semicolon-free style, not a TypeScript problem.

const [head, ...rest] = [1, 2, 3, 4]
// head: number | undefined (noUncheckedIndexedAccess)
// rest: number[]

console.log(
  id,
  name,
  rupees,
  email,
  orderId,
  orderMeta,
  maybeOrder,
  state,
  first,
  third,
  a,
  b,
  head,
  rest,
)
