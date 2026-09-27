// Generics: a type parameter is a placeholder the caller fills in at the call
// site. The declaration and the resolution are checked against each other.

function first<T>(items: T[]): T | undefined {
  return items[0]
}

const firstString = first(["a", "b"])   // string | undefined
const firstNumber = first([1, 2])       // number | undefined

// The point: one function, and the return type tracks the input. Without the
// generic you would need `firstString` and `firstNumber`, or `any`, or a
// type assertion at each call site.
//
// ---------------------------------------------------------------------------
// The return type has to mention T
// ---------------------------------------------------------------------------
// Returning `T` when the value might not exist forces the `| undefined`.
// `function bad<T>(items: T[]): T { return items[0] }` is TS2322 under
// noUncheckedIndexedAccess, and TS2535 ("T could be instantiated with a
// different subtype") even without it. The signature is telling the truth
// about the implementation, not being fussy.
//
// ---------------------------------------------------------------------------
// T is unknown inside the body, not any
// ---------------------------------------------------------------------------
// An unconstrained `T` behaves as `unknown` in the function body, so you
// cannot touch its members:
function noAccess<T>(value: T): string {
  // return value.toString()   //  TS2571: Object is of type 'unknown'
  return typeof value
}

// That is deliberate and it is the safe default. To use T as a concrete type
// you constrain it (next file). The asymmetry worth remembering:
//   - parameter position: contravariant, checked backwards
//   - return position: covariant, checked forwards
//
// ---------------------------------------------------------------------------
// When inference has nothing to work from
// ---------------------------------------------------------------------------
function create<T>(): T {
  // return {}   //  TS2355: a function whose declared type is neither
  //               'undefined', 'void', nor 'any' must return a value.
  throw new Error("not implemented")
}

// Calling with no arguments gives nothing to infer from:
//   const x = create()          ->  TS7053 / TS7006, inferred as `unknown`
//   const y = create<number>()  // explicit, fine
declare const forced: number
const withHint = create<typeof forced>()

// The fix is a default type parameter or an explicit argument - not `any`.
// `function create<T = unknown>(): T` makes the gap explicit at the type
// level instead of letting it become an error.

// ---------------------------------------------------------------------------
// Generic functions that earn their place in real code
// ---------------------------------------------------------------------------
// 1. Pluck: pick one property out of a list of objects, keeping the type.
// function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

type Row = { id: string; qty: number; price: number }
declare const rows: Row[]
const ids = pluck(rows, "id")     // string[]
const qtys = pluck(rows, "qty")   // number[]
// pluck(rows, "nope")          ->  TS2345, 'nope' is not a key

// 2. Zip two arrays into tuples.
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const out: [A, B][] = []
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    out.push([a[i] as A, b[i] as B])
  }
  return out
}

const zipped = zip(["a"], [1])   // [string, number][]

// 3. Wrap a value so the type cannot be confused for a bare value.
type Result_<T> = { ok: true; value: T } | { ok: false; error: string }
function ok<T>(value: T): Result_<T> {
  return { ok: true, value }
}
function err<T>(error: string): Result_<T> {
  return { ok: false, error }
}

// `ok(1)` is `{ ok: true; value: number }` and `err<string>("x")` is
// `{ ok: false; error: string }`. The marker type is what makes a
// discriminated union usable; the generic is what keeps the payload typed.

// ---------------------------------------------------------------------------
// Generic aliases
// ---------------------------------------------------------------------------
// A type alias can be generic too, which is where most of the utility type
// machinery comes from.
type Nullable<T> = T | null
type DeepReadonly<T> = T extends (infer R)[] ? readonly DeepReadonly<R>[] : T
// ^ conditional types and `infer`, covered in the type-level section

console.log(firstString, firstNumber, noAccess(1), withHint, ids, qtys, zipped, ok(1), err("x"), create)
export { first, noAccess, create, pluck, zip, ok, err }
export type { Row, Result_, Nullable, DeepReadonly }
