// Overloads: several public signatures, one hidden implementation.
//
// The rule that makes them necessary: a function's *return* type must be one
// type, but sometimes it depends on the argument. `JSON.parse` is the canonical
// example - it returns `any`, which is why `JSON.parse(x) as T` is a guess
// rather than a check.

function parse(input: string): object
function parse(input: string, reviver: (key: string, value: unknown) => unknown): unknown
function parse(input: string, reviver?: (key: string, value: unknown) => unknown): unknown {
  const parsed: unknown = JSON.parse(input)
  return reviver ? reviver("", parsed) : parsed
}

// The first matching overload wins, in declaration order. Order matters:
// a broad overload first shadows the specific ones below it.
const asObject = parse("{}")          // object
const viaReviver = parse("{}", (k, v) => v)  // unknown

// ---------------------------------------------------------------------------
// The implementation signature is invisible
// ---------------------------------------------------------------------------
// The implementation accepts `string | undefined` for the reviver, which is
// not in either public signature, so:
declare const maybeInput: string | undefined
// parse(maybeInput)  ->  TS2769: No overload matches this call.
//   Overload 1 of 2, '(input: string): object', gave the following error.
//     Argument of type 'string | undefined' is not assignable to 'string'.
//
// This is frequently a feature: the implementation can accept `undefined`
// internally while the public API insists on an argument.
//
// ---------------------------------------------------------------------------
// Every overload must be assignable to the implementation
// ---------------------------------------------------------------------------
function bad(x: string): number
function bad(x: number): string
// function bad(x: string | number): string | number { return x }  // ok actually
function bad(x: string | number) {
  return x
}
// This one is fine. The compiler reports incompatibility on the
// *implementation* line, not on the overload, which is the confusing part:
//   function bad(x: string | number): number { return x }
//   -> TS2394: This overload signature is not compatible with its
//      implementation signature.

// ---------------------------------------------------------------------------
// Optional parameters interact badly with overloads
// ---------------------------------------------------------------------------
// TS2464: "A signature which has optional parameters cannot have overloads
// following it." The compiler cannot tell which overload you meant once an
// argument is omitted, so it refuses. Put the optional-parameter overload
// last, or give every overload the same arity.
function fmt(x: number): string
function fmt(x: number, decimals: number): string
function fmt(x: number, decimals?: number): string {
  return decimals === undefined ? x.toString() : x.toFixed(decimals)
}

// ---------------------------------------------------------------------------
// Generic overloads
// ---------------------------------------------------------------------------
// A generic signature usually covers more than a fixed overload list, so reach
// for it first.
function mapAll<T, U>(items: T[], fn: (item: T, index: number) => U): U[] {
  return items.map(fn)
}
// A single generic signature handles both of these, correctly typed:
//   mapAll([1, 2], n => n.toFixed(2))   ->  string[]
//   mapAll(["a"], s => s.length)         ->  number[]
//
// Overloads earn their place when the *arity or shape* differs, not the
// element type.

// ---------------------------------------------------------------------------
// A real-world overload set: typed fetch
// ---------------------------------------------------------------------------
// Four signatures, one implementation. Each returns a different type, which
// is the entire reason the pattern exists.
function request(url: string): Promise<string>
function request(url: string, as: "json"): Promise<unknown>
function request<T>(url: string, as: "json", fallback: T): Promise<T | unknown>
function request<T>(url: string, as?: "json", fallback?: T): Promise<unknown> {
  return Promise.resolve(as === "json" ? (fallback ?? { url }) : url)
}

// Order note: the `as: "json"` overload must come before a hypothetical
// `request(url: string, as?: string)` catch-all, or it would be shadowed.

// ---------------------------------------------------------------------------
// When not to use overloads
// ---------------------------------------------------------------------------
// If all the branches return the same type, a union return type is simpler
// and shows up better in tooltips:
//
//   function bad(n: number): number | string { ... }
//
// Overloads are for *different shapes*, not different values. And if the
// difference is only in the input, generics are usually better: one signature,
// and the relationship between input and output is enforced by the compiler
// instead of by N hand-written pairs that can drift apart.

console.log(asObject, viaReviver, bad("x"), fmt(1), fmt(1, 2), mapAll([1, 2], (n) => n.toFixed(1)), request("u"), request("u", "json"), request("u", "json", { a: 1 }))
export { parse, fmt, mapAll, request }
