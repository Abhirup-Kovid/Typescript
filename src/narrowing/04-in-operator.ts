// `in` narrows a union of object types by asking which keys exist on the
// value. It is the tool for unions `typeof` cannot touch.

type Masala = { type: "masala"; spicelevel: number }
type Ginger = { type: "ginger"; amount: number }
type Elaichi = { type: "elaichi"; aroma: number }
type Plain = { type: "plain" }

type Chai = Masala | Ginger | Elaichi | Plain

declare const order: Chai

// Narrow by a key that only some arms declare.
function describe(order: Chai): string {
  if ("spicelevel" in order) {
    return `spice ${order.spicelevel}`   // narrowed to Masala
  }
  if ("amount" in order) {
    return `ginger amount ${order.amount}` // narrowed to Ginger
  }
  if ("aroma" in order) {
    return `aroma ${order.aroma}`        // narrowed to Elaichi
  }
  return "plain chai"                    // narrowed to Plain
}

console.log(describe(order))

// ---------------------------------------------------------------------------
// Why this works, and what it costs
// ---------------------------------------------------------------------------
// The compiler narrows to the arms that *declare* the key as required. If an
// arm declares it optional, both that arm and the non-declaring arms survive,
// so `in` gives you no narrowing at all. Required keys only.

type WithOptionalKey = { kind: "a"; note?: string } | { kind: "b" }

function badNarrow(value: WithOptionalKey): string {
  // value stays `WithOptionalKey` in the true arm, because `note` is optional
  // on the first arm and absent on the second. The check is legal, it just
  // does not help.
  if ("note" in value) {
    return value.kind
  }
  return value.kind
}

// ---------------------------------------------------------------------------
// `in` on a non-union does nothing, and can throw
// ---------------------------------------------------------------------------
// Runtime semantics matter here: `key in value` throws a TypeError if value is
// a primitive or null/undefined. The compiler will stop you for a nullish
// value under strictNullChecks, but a bare `string` on the right of `in` is
// not caught by the type system at all - it is a runtime crash.
function crashesOnPrimitive(value: string | { a: number }): boolean {
  // value is string here at runtime; `"a" in "abc"` throws.
  // Nothing in the type system stops this. Guard the nullish case first and
  // only use `in` on object-typed unions.
  return "a" in (value as object)
}

// ---------------------------------------------------------------------------
// `in` versus a discriminant
// ---------------------------------------------------------------------------
// Every variant above carries `type`, which makes it a discriminated union -
// and a discriminant is strictly better than `in` for exhaustiveness:
//
//   switch (order.type) { ... }   // adding a variant breaks non-exhaustive
//                                 // switches automatically
//   if ("spicelevel" in order)     // adding a variant silently falls through
//                                 // to the final `return`
//
// So `in` is the fallback for unions with no shared literal-typed field, not
// the first thing to reach for. It earns its place on unions of shapes from
// different sources that you cannot redesign.

type ApiResponse =
  | { user: { id: string }; token: string }
  | { error: { code: number }; requestId: string }

function handle(response: ApiResponse): string {
  if ("token" in response) {
    return response.token
  }
  return `${response.error.code}/${response.requestId}`
}

console.log(badNarrow({ kind: "b" }), crashesOnPrimitive("abc"), handle({ user: { id: "u1" }, token: "t" }))
