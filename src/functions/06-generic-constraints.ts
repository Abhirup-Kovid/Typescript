// `extends` on a type parameter is a constraint: a promise about what T is
// guaranteed to be, not a replacement for T.

function len<T extends { length: number }>(value: T): number {
  return value.length
}
len("abc")        // number
len([1, 2])       // number
// len(42)        //  TS2345: 'number' does not satisfy the constraint

// ---------------------------------------------------------------------------
// A constraint is a floor, not a substitution
// ---------------------------------------------------------------------------
// This is the mistake that makes people distrust constraints. Inside the
// body, `value` is `T`, and T is *at least* `{ length: number }`. It is not
// `{ length: number }`.
function wrong<T extends { length: number }>(value: T): void {
  // value is T, and the constraint only unlocked `length`:
  //   value.push?.("x")   //  TS2339: Property 'push' does not exist on type 'T'
  //   value.length = 0     //  TS2540, a read-only property on a generic
  console.log(value.length)
}

// The rule: the constraint unlocks exactly the members the constraint type
// declares, and nothing more.

// ---------------------------------------------------------------------------
// keyof: the constraint that unlocks property access
// ---------------------------------------------------------------------------
// This is the shape you will write most often.
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

type Row = { id: string; qty: number }
declare const rows: Row[]
const a = pluck(rows, "id")   // string[]
const b = pluck(rows, "qty")  // number[]
// pluck(rows, "nope")       //  TS2345

// `K extends keyof T` does two things at once: the argument must be a real
// key, and the return type `T[K]` is a *lookup*, so the element type follows
// from the key. That correlation is impossible without generics, and it is
// the reason `keyof` appears in every utility type in the standard library.

// ---------------------------------------------------------------------------
// Constraints are checked eagerly, at the call site
// ---------------------------------------------------------------------------
// Not lazily, when the body happens to run:
function pick<T extends string>(items: T[], index: T extends string ? 0 : never): void {
  console.log(items, index)
}
// pick<number>([1], 0)   //  TS2345, immediately, even though the body would
//                        //  never be reached with a bad index

// ---------------------------------------------------------------------------
// Default type parameters
// ---------------------------------------------------------------------------
// A default makes the parameter optional at the type level. Constraints must
// come first.
type Dict<T = unknown> = Record<string, T>

const s: Dict = {}                       // Record<string, unknown>
const n: Dict<number> = { a: 1 }         // Record<string, number>

// A default that is too wide defeats the purpose - `Dict` defaulting to
// `unknown` means `d.anything` is an error, which is usually what you want,
// but `Dict<any>` would silently accept anything. Pick the default
// deliberately.

// ---------------------------------------------------------------------------
// Generic defaults plus overloads
// ---------------------------------------------------------------------------
function toArray<T = string>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
const t1 = toArray("a")        // string[]  (T defaulted to string)
const t2 = toArray(1)          // number[]  (T inferred)
const t3 = toArray<number>([1, 2])  // number[]

// ---------------------------------------------------------------------------
// When a constraint should be an interface
// ---------------------------------------------------------------------------
// `T extends Array<any>` is worse than `T extends unknown[]`, because `any`
// in the constraint disables checking inside it. `readonly T[]` is usually the
// constraint you actually want, since it also accepts readonly arrays.
function lastOf<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1]
}
declare const ro: readonly number[]
const l1 = lastOf(ro)   // number | undefined. readonly is accepted.
const l2 = lastOf([1])  // number | undefined

// ---------------------------------------------------------------------------
// Constraints on multiple parameters
// ---------------------------------------------------------------------------
// `K extends keyof T` where T is itself constrained interacts in ways worth
// knowing. Here the *input* must have the key, and the *output* is looked up
// through it:
function rekey<T, K extends keyof T>(row: T, from: K, to: keyof T): T {
  const out = { ...row }
  // out[from] = out[to]  //  TS2535 in some arrangements, because T and
  //                      //  keyof T are not provably the same shape
  return out
}
// This is the known rough edge: indexed writes on a generic with `keyof T`
// need help. The usual fixes are a cast, an `as T` on the copy, or splitting
// the type so the key is a plain literal union instead of `keyof T`.

console.log(len("a"), a, b, s, n, t1, t2, t3, l1, l2, rekey({ x: 1 }, "x", "x"))
export { len, pluck, toArray, lastOf, rekey }
export type { Row, Dict }
