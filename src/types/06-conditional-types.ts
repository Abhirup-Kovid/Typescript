// `T extends U ? X : Y` - choose a type based on whether T is assignable to U.

type IsString<T> = T extends string ? true : false

type A = IsString<string>    // true
type B = IsString<number>    // false
type C = IsString<string | number>  // boolean! See distribution below.

// ---------------------------------------------------------------------------
// Distribution: the single most important behaviour
// ---------------------------------------------------------------------------
// When the checked type is a *naked type parameter* and it is a union, the
// conditional distributes: it evaluates once per member and the results union.
type Distributed<T> = T extends any ? "yes" : "no"
type D1 = Distributed<string | number>
// "yes" | "yes" which collapses to "yes"

type Distributed2<T> = T extends string ? "str" : "other"
type D2 = Distributed2<string | number>
// "str" | "other"    <- note: not "other"

type Distributed3<T> = [T] extends [string] ? "str" : "other"
type D3 = Distributed3<string | number>
// "other"  <- the tuple wrapper blocks distribution, so this is one check
//            against the whole union, and the whole union fails it.
//
// `[T] extends [U]` is the standard trick for "check the whole union at
// once", and you need it whenever you want a single yes/no rather than a
// per-member answer. `string | number extends string` is false, which is
// almost never what `T extends string` was trying to express.

// Distribution is why `Exclude` and `Extract` work, and why `NonNullable`
// is `T extends null | undefined ? never : T`.

// ---------------------------------------------------------------------------
// The real uses
// ---------------------------------------------------------------------------
// 1. Extracting / excluding union members.
type Animal = "cat" | "dog" | "bird" | "fish"
type Mammal = "cat" | "dog"
type ExtractMammals<T, U> = T extends U ? T : never
type ExcludeFish<T, U> = T extends U ? never : T

const m1: ExtractMammals<Animal, Mammal> = "cat"
const m2: ExcludeFish<Animal, "fish"> = "dog"
// const m3: ExcludeFish<Animal, "fish"> = "fish"  // TS2322

// 2. Inferring the element type of a function's return.
type Unpacked<T> = T extends (...args: never[]) => infer R ? R : never
type Fn = () => string
const unpacked: Unpacked<Fn> = "a"

// 3. Making a function's return type depend on its argument.
function parse<T extends string>(input: T): T extends `${infer N extends number}` ? number : T {
  // The `infer N extends number` form (TS 4.8) constrains the inference, so
  // you get a `number` rather than `unknown`.
  return (input as unknown as number) as never
}

// 4. Typed event names from a payload map - the highest-value everyday use.
type EventMap = {
  click: { x: number; y: number }
  key: { key: string }
  close: undefined
}

type EventName<T> = keyof T
type EventOf<T, K extends EventName<T>> = T[K]
// One level of conditional is enough here - the reason to reach for the
// nested form is when the *resolved* type itself needs re-testing, which
// `T[K]` already gives you for free.
type EventArg<T, K extends EventName<T>> = T[K] extends undefined ? void : T[K]

function on<T, K extends EventName<T>>(name: K, handler: (arg: EventArg<T, K>) => void): void {
  console.log(name, handler)
}

on<{ click: { x: number; y: number } }, "click">("click", (arg) => {
  console.log(arg.x, arg.y)   // both numbers, not unknown
})

// `close` maps to `undefined`, so `EventArg` rewrites that to `void` and the
// handler takes no arguments - the ergonomics you would hand-write by hand
// otherwise, derived from the map instead of kept in sync with it.

// ---------------------------------------------------------------------------
// The recursion limit
// ---------------------------------------------------------------------------
// Conditional types can be recursive, and the compiler gives up:
//   type Deep<T> = T extends object ? { [K in keyof T]: Deep<T[K]> } : T
//   type Bad = Deep<{ a: { b: { c: { ... 50 levels ... } } } }>
//   -> TS2589: Type instantiation is excessively deep and possibly infinite.
//
// The limit is 50 for type instantiation depth, and also a total instantiation
// count (5,000,000 for the checker). Recursive conditional types are
// legitimate and useful - JSON parsing types, deep readonly - but you hit the
// wall on deeply nested data, and the error names neither the type nor the
// depth. Recognising TS2589 as "too deep" rather than "buggy" saves time.
type DeepReadonly2<T> = T extends (infer U)[]
  ? readonly DeepReadonly2<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly2<T[K]> }
    : T

type Nested = { a: { b: { c: string } } }
type FrozenNested = DeepReadonly2<Nested>

// ---------------------------------------------------------------------------
// A return type that depends on the argument
// ---------------------------------------------------------------------------
// This is the everyday payoff of conditionals: one function, two different
// static return types, and the relationship enforced by the compiler rather
// than documented in a comment.
//
// The `stringify` return is spelled as `string` rather than
// `JSON.stringify(T)` because the latter is an instantiation expression, which
// is not a type in this position. Being explicit about it is also clearer.
type Jsonify<T> = T extends string | number | boolean | null ? T : string

declare function jsonify<T>(value: T): Jsonify<T>

const j1 = jsonify("a")      // string
const j2 = jsonify({ a: 1 }) // string
const j3 = jsonify(1)        // number - it extends number, so T survives
console.log(j1, j2, j3)

console.log(m1, m2, unpacked, parse("12"), j1, j2, on)
export type { IsString, A, B, C, Distributed, D1, Distributed2, D2, Distributed3, D3, Animal, Mammal, ExtractMammals, ExcludeFish, Unpacked, Fn, EventMap, EventName, EventOf, EventArg, DeepReadonly2, Nested, FrozenNested, Jsonify }
