// `infer` extracts a type from a position. It only exists inside the true
// branch of a conditional type, and it is what turns "does this match a
// shape" into "what is the shape's type parameter".

type Unpacked<T> = T extends (...args: never[]) => infer R ? R : never
type Fn = () => string

const u1: Unpacked<Fn> = "a"   // string

// A Promise is not a function type, so it does not match and the false branch
// applies:
//
//   const u2: Unpacked<Promise<number>> = 1
//   -> TS2322: Type '1' is not assignable to type 'never'.
//
// To unwrap a promise you need `Awaited`, which is the recursive version of
// the same idea. That is exactly what `ReturnType` cannot do for you either -
// `ReturnType<() => Promise<number>>` is `Promise<number>`, so async functions
// need `Awaited<ReturnType<F>>` to get the resolved value.
type u2 = Unpacked<Promise<number>>  // never

// When the pattern does not match, the false branch applies. Here that is
// `never`, and `never` is the *empty* type - there is no value assignable to
// it, not even `undefined`:
//
//   const u3: Unpacked<string> = "not a function"
//   -> TS2322: Type 'string' is not assignable to type 'never'.
//
// That is the right behaviour and it is worth internalising: a conditional
// type that resolves to `never` is the compiler saying "this is impossible",
// which is a stronger and more useful statement than `unknown`.

// `infer X` declares a type variable scoped to the conditional. The pattern
// it matches against is on the left, and the compiler solves for X.

// ---------------------------------------------------------------------------
// infer is just a pattern match, and it can be any pattern
// ---------------------------------------------------------------------------
// Arrays:
type Elem<T> = T extends (infer U)[] ? U : never
const e1: Elem<number[]> = 1
// Elem<Promise<string>> is `never`, so there is nothing you can assign to it.

// Objects - the single most useful form:
type ItemOf<T> = T extends { items: Array<infer U> } ? U : never
const i1: ItemOf<{ items: string[] }> = "a"

// Multiple infers in one pattern:
type Pair<T> = T extends [infer A, infer B] ? [A, B] : never
const p1: Pair<[string, number]> = ["a", 1]

// infer on a property position, which is how you read a type out of a
// function's signature without Parameters/ReturnType:
type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never
const f1: FirstArg<(a: string, b: number) => void> = "x"

// `infer` is greedy-but-bounded: it matches as much as the pattern needs and
// no more, which is why `T extends (infer U)[]` gives the *element* type and
// not the array.

// ---------------------------------------------------------------------------
// Constraining an infer (TS 4.8)
// ---------------------------------------------------------------------------
// `infer X extends C` constrains what X may resolve to. Without it, an infer
// in a position with a constraint resolves to the constraint, not the actual
// type - which is a well-known surprise.
type Unconstrained<T> = T extends Array<infer E> ? E : never
declare const arr: number[]
const uc: Unconstrained<number[]> = 0

// With the constraint form, you get a real `string` instead of `unknown`:
//   const bad: "abc".match(...)   -- the classic example is
//   "abc".match(/a/)  ->  RegExpMatchArray | null, and indexing match[0] is
//   string. Without the constraint, `infer S extends string` is what makes
//   the captured group a `string` rather than `unknown`.
type Group<T extends RegExpMatchArray> = T extends Array<infer S extends string> ? S : never

// ---------------------------------------------------------------------------
// infer in practice: a real parse
// ---------------------------------------------------------------------------
// Extract the numeric part of a template-literal string. This is the pattern
// behind URL routers, CSS-in-JS, i18n keys, and template string validation.
type ExtractQuery<QS> = QS extends `${string}?${infer Q}` ? Q : never
type EQ = ExtractQuery<"/users?id=1&name=ravi">  // "id=1&name=ravi"

type ExtractPath<URL> = URL extends `${infer Origin}/api/${infer Rest}` ? Rest : never
type EP = ExtractPath<"https://x.com/api/users/1">  // "users/1"

// Split a key-value pair. Note the order matters: the first `infer` is greedy
// up to the first `=`, because `${infer K}=${infer V}` splits on the first
// match, and the rest goes to V.
type SplitPair<P> = P extends `${infer K}=${infer V}` ? [K, V] : never
const sp: SplitPair<"a=1"> = ["a", "1"]

// Strip a leading prefix, which is what you want for a route table.
type StripPrefix<P extends string, S extends string> = P extends `${S}${infer Rest}` ? Rest : never
const stripped: StripPrefix<"/api/users", "/api"> = "/users"

// ---------------------------------------------------------------------------
// infer versus Parameters/ReturnType
// ---------------------------------------------------------------------------
// For the common cases, use the built-ins. `Parameters<F>` is
// `F extends (...args: infer P) => any ? P : never` and `ReturnType<F>` is
// `F extends (...args: any) => infer R ? R : any` - that is literally their
// definition, and knowing it explains their limits:
//
//  - `Parameters` requires F to be a function type. It will not work on an
//    overloaded function except for the last overload.
//  - `ReturnType` of an `async` function is a `Promise`, so you need
//    `Awaited<ReturnType<F>>` to get the resolved value.
//  - Both use `any` internally, which is why they are not fully strict.
//
// Writing your own with `never[]` instead of `any` is the strict version,
// and that is the reason the `(...args: never[]) => infer R` spelling appears
// in library code.

console.log(u1, e1, i1, p1, f1, uc, sp, stripped)
export type { Unpacked, Fn, u2, Elem, ItemOf, Pair, FirstArg, Unconstrained, Group, ExtractQuery, EQ, ExtractPath, EP, SplitPair, StripPrefix }
