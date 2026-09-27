// `type` and `interface` describe the same object shape. The differences are
// in what else they can become, and in how they behave under change.

interface Point1 {
  x: number
  y: number
}

type Point2 = {
  x: number
  y: number
}

const p1: Point1 = { x: 0, y: 0 }
const p2: Point2 = { x: 0, y: 0 }

// Both are structurally identical, so they are mutually assignable.
const a: Point1 = p2
const b: Point2 = p1

// ---------------------------------------------------------------------------
// 1. Declaration merging - interface only
// ---------------------------------------------------------------------------
// Two `interface` declarations of the same name merge. This is how you extend
// a library's types from outside it.
interface Box {
  id: string
}
interface Box {
  label?: string
}
const merged: Box = { id: "1", label: "x" }
// Box is now { id: string; label?: string }

// Two `type` aliases of the same name are a duplicate identifier error:
//   type Box = { id: string }
//   type Box = { label: string }    ->  TS2300: Duplicate identifier

// The flip side: merging is only useful if the members do not collide. Two
// interfaces declaring `id` with different types is TS2717.

// ---------------------------------------------------------------------------
// 2. Unions and conditionals - type only
// ---------------------------------------------------------------------------
// An interface names an *object* type, so it cannot be anything else.
type Status = "idle" | "busy" | "error"
type Maybe<T> = T | null

// `keyof` applied to a *union* is the intersection of the keys, not the union.
// `keyof Status` is the union of Status's keys ("idle" | "busy" | "error"),
// but `keyof (Status | { extra: boolean })` is `never` - no key is common to
// both sides. Getting `never` from `keyof` is nearly always this, and it is
// worth recognising rather than debugging blind.
type KeysOfUnion = keyof (Status | { extra: boolean })
// KeysOfUnion is `never`.
//
// The useful counterpart is the distributive form, which is a conditional
// type and does give the union of keys:
//   type KeysOf<T> = T extends T ? keyof T : never
//   type K = KeysOf<Status | { extra: boolean }>  // "idle" | "busy" | "error"
//                                                // | "extra"
// Covered in conditional-types.

// An interface cannot be a union:
//   interface Bad extends Status {}   ->  TS2846
//   interface Bad = "idle" | "busy"    ->  TS1382

// ---------------------------------------------------------------------------
// 3. Error messages and hovers
// ---------------------------------------------------------------------------
// This one is not a style preference. A named interface prints its name in
// errors and hovers; an anonymous type literal is expanded every time.
interface Order {
  id: string
  customer: { name: string; email?: string }
  items: { sku: string; qty: number }[]
}

const good: Order = { id: "1", customer: { name: "a" }, items: [{ sku: "s", qty: 1 }] }
console.log(good)
// const bad1: Order = { id: "1", customer: { name: "a" }, items: [{}] }
//   TS2739: Type '{}' is missing the following properties from type
//          '{ sku: string; qty: number; }': sku, qty
//
// The `Order` name appears once. With an inline type literal, that whole
// expansion appears in every error from every file that uses it. Interfaces
// exist partly to give the compiler a name to print.

// ---------------------------------------------------------------------------
// 4. Extending
// ---------------------------------------------------------------------------
// An interface can extend an object type or another interface.
interface WithLabel extends Box {
  checked: boolean
}

// A `type` can extend a union, which an interface cannot:
type AllStates = Status | "paused" | { detail: string }
type WithDetail = AllStates & { detail: string }

// A type alias intersection is how you combine; `extends` can only take a
// single statically-known object type.

// ---------------------------------------------------------------------------
// Which to use
// ---------------------------------------------------------------------------
// `interface`:
//   - an object shape with named members
//   - something you will implement with a class
//   - something third parties will extend or augment
//   - anywhere you want the name in the error message
//
// `type`:
//   - a union, an intersection, a conditional, a mapped type
//   - a primitive, a tuple, a function type
//   - anything that is not a plain object shape
//
// The practical default: reach for `interface` when you are describing a
// thing, and `type` when you are describing a relationship between things.
// When genuinely undecided, `interface` for objects is the lower-friction
// choice, because you can convert to `type` later and not the other way
// round without churn.

console.log(p1, p2, a, b, merged)
export type { Point1, Point2, Status, Maybe, KeysOfUnion, Order, WithLabel, AllStates }
