// The utility types in lib.es5.d.ts, in the order you will reach for them.
// Nearly all of them are two or three lines of mapped/conditional type, and
// knowing that is what makes them debuggable.

type User = {
  id: string
  name: string
  age?: number
  readonly createdAt: number
  tags: string[]
}

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------
// Partial<T>   ->  { [K in keyof T]?: T[K] }
type P = Partial<User>
// Everything optional, but the *types* are untouched. `age?: number` was
// already optional, so no change; `id: string` becomes `id?: string`.
//
// Note that Partial on a property with a default is a semantic change, not a
// syntactic one: `{ port?: number }` no longer means "8080", it means
// "unknown, and undefined is allowed". With exactOptionalPropertyTypes on it
// rejects `{ port: undefined }`, which is the more accurate reading.
declare const partialUser: P
const pu: P = { id: "1" }   // only the id is needed

// Required<T>  ->  { [K in keyof T]-?: T[K] }
type R = Required<User>
// `age` becomes `age: number`. This is the *inverse* of Partial, and a real
// User is not assignable to it, because a real User may have no age.
//   const u: Required<User> = { id, name, createdAt, tags }  // TS2739, age

// Readonly<T> ->  { readonly [K in keyof T]: T[K] }
type RO = Readonly<User>
// Shallow. `tags` is still a mutable `string[]` behind a readonly property,
// so `ro.tags.push("x")` compiles. Deep readonly needs a recursive type.
//   type DeepReadonly<T> = T extends (infer U)[] ? readonly DeepReadonly<U>[]
//     : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T

// ---------------------------------------------------------------------------
// Choosing keys
// ---------------------------------------------------------------------------
// Pick<T, K>  ->  { [P in K]: T[P] }
type IdName = Pick<User, "id" | "name">   // { id: string; name: string }
// K extends keyof T, so a typo in the key list is a compile error - which is
// the point. Note it does *not* make the picked keys optional.

// Omit<T, K>  ->  Pick<T, Exclude<keyof T, K>>
type NoAge = Omit<User, "age" | "createdAt">
// { id: string; name: string; tags: string[] }
// Built on Exclude, which is built on a conditional type. Omit on a union does
// not distribute - Omit<A | B, K> is not Omit<A, K> | Omit<B, K>.

// Record<K, V>  ->  { [P in K]: V }
type Scores = Record<"math" | "chem", number>
const scores: Scores = { math: 90, chem: 80 }
// A total map: a missing key is TS2741. Add a subject to the union and every
// Record of it needs the new entry - which is how you get exhaustiveness
// without a switch.
//
// The `Record<string, V>` form is different in kind: it is an index
// signature, so any key is allowed and reading returns `V | undefined` under
// noUncheckedIndexedAccess. Use it for dictionaries, not for known shapes.

// ---------------------------------------------------------------------------
// Filtering union members
// ---------------------------------------------------------------------------
// Extract<T, U>  ->  T extends U ? T : never
// Exclude<T, U>  ->  T extends U ? never : T
// NonNullable<T> ->  T extends null | undefined ? never : T
// These three are the same conditional type with the branches swapped. They
// distribute over unions, which is the property that makes them work on a
// union input and is *not* shared with a hand-written non-distributive
// version.

type Status = "queued" | "done" | "error" | null
type Active = Exclude<Status, "done" | "error" | null>   // "queued"
type HasValue = NonNullable<Status>   // "queued" | "done" | "error"

// `Required<T>`'s cousin: `Required<Status>` would be "queued" | "done" |
// "error" | undefined? No - `Required` operates on properties, not union
// members. To remove nullish from a union it is always NonNullable.

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------
type Fn = (a: string, b?: number) => boolean

// Parameters<F>  ->  F extends (...args: infer P) => any ? P : never
type Args = Parameters<Fn>   // [a: string, b?: number]
// The optional marker is preserved, which is why you can spread `args` into a
// call of `fn` safely.
//
// ReturnType<F>  ->  F extends (...args: any) => infer R ? R : any
type Ret = ReturnType<Fn>   // boolean
// ReturnType of an async function is the Promise, not the resolved value.
// That is not a bug, it is the definition - use Awaited<ReturnType<F>>.
//
// Neither works on an overloaded function except for the *last* overload,
// which is a genuinely surprising limitation if you have not hit it.

// Awaited<T> - recursively unwraps a Promise.
declare function fetchUser(): Promise<{ id: string }>
type Fetched = Awaited<ReturnType<typeof fetchUser>>   // { id: string }
// Recursive because `await Promise<Promise<T>>` also flattens, and because a
// thenable is not necessarily a Promise. This is the built-in that
// Unpacked<T> in the previous file cannot be.

// ThisParameterType<F> - the type of `this` in a function. (The built-in is
// named ThisParameterType, not ThisParameter - there is no `ThisParameter`.)
type WithThis = { greet(this: { name: string }): string }
type ThisArg = ThisParameterType<WithThis["greet"]>   // { name: string }

// OmitThisParameter<F> - drops the `this` parameter so the rest are
// positional arguments. The fix for "I got an extra leading argument".
type NoThis = OmitThisParameter<WithThis["greet"]>
type NoThisArgs = Parameters<NoThis>   // []

// ---------------------------------------------------------------------------
// Which to reach for, and when to stop
// ---------------------------------------------------------------------------
// The ladder:
//   1. Is there a built-in? Prefer it - it is fast, correct, and already
//      debugged by everyone who has used it.
//   2. A one-line mapped or conditional type over your own domain type.
//   3. `as` at a boundary, with a runtime check beside it.
//
// Beyond that you are usually better off modelling the thing differently. A
// utility type that takes four nested conditionals to express is a signal
// that the domain type could be simpler - usually a discriminated union
// where you currently have a bag of optionals.
//
// Two warnings:
//   - They are all shallow. Deep versions exist in utility libraries and are
//     worth copying when you need one, not writing when you do not.
//   - They are erased. `Partial<User>` does not make a real object partial at
//     runtime, and nothing enforces the "only these keys" half of `Omit` on a
//     value that came from somewhere else.

declare const active0: Active
declare const readonlyUser: RO
declare const requiredUser: R
declare const idName: IdName
declare const noAge: NoAge
declare const fnArgs: Args
declare const fnRet: Ret
declare const fetched: Fetched
declare const thisArg: ThisArg
declare const noThisArgs: NoThisArgs

console.log(pu, partialUser, scores, active0, readonlyUser, requiredUser, idName, noAge, fnArgs, fnRet, fetched, thisArg, noThisArgs)
export type { User, P, R, RO, IdName, NoAge, Scores, Status, Active, HasValue, Fn, Args, Ret, Fetched, WithThis, ThisArg, NoThis, NoThisArgs }
