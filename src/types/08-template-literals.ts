// A template literal type is a type-level string template. It exists so the
// compiler can validate string *shapes*.

type Event = "click" | "focus"
type Handler = (payload: string) => void

// `on${Capitalize<Event>}Change` expands to a finite union of four strings:
//   "onClickChange" | "onClickChange" ... precisely:
//   "onClickChange" | "onFocusChange"
type Hook = `on${Capitalize<Event>}Change`

// The compiler computed a closed set of two strings. Assigning anything else
// is an error, with the full expansion in the message.
declare const hook: Hook
const h1: Hook = "onClickChange"

// A template literal type with a general `string` in it is no longer a finite
// set - it is an infinite one, and it stops being checkable:
type Path = `/${string}`
declare const path: Path
const p1: Path = "/users/1"
const p2: Path = "/"
// const p3: Path = "users"   // TS2322. Leading slash required.

// ---------------------------------------------------------------------------
// Splitting strings at the type level
// ---------------------------------------------------------------------------
// Once you can pattern-match on strings, you can parse them. This is the
// mechanism behind typed routers and typed query strings.
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? Head | Split<Tail, D>
    : never

type Parts = Split<"a.b.c", ".">   // "a" | "b" | "c"
const parts: Parts = "b"

// A terminal that always fires, so the recursion has a base case. Without it
// the type is an infinite conditional and the compiler reports TS2589.

type TrimSlash<S extends string> = S extends `/${infer R}` ? R : S
type Trimmed = TrimSlash<"/users/">  // "users/"

type TrimBoth<S extends string> = TrimSlash<S extends `${infer R}/` ? R : S>
type TB = TrimBoth<"/users/">  // "users"

// ---------------------------------------------------------------------------
// Typed route parameters
// ---------------------------------------------------------------------------
// The highest-value application, and the one you will actually ship.
type ExtractParams<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}`
    ? P | ExtractParams<`/${Rest}`>
    : S extends `${string}:${infer P}`
      ? P
      : never

type Route = "/users/:id/posts/:postId"
type Params = ExtractParams<Route>   // "id" | "postId"

function navigate<P extends string>(route: P, params: Record<ExtractParams<P>, string>): void {
  // The keys of `params` are derived from the route. Pass the wrong key and
  // it is a compile error, and it stays correct when you add a parameter to
  // the route - no manual sync.
  console.log(route, params)
}

navigate("/users/:id/posts/:postId", { id: "1", postId: "2" })
// navigate("/users/:id", { wrong: "1" })   // TS2345
// navigate("/users/:id", {})                // TS2739, missing `id`

// ---------------------------------------------------------------------------
// Typed event names
// ---------------------------------------------------------------------------
type Emitter<Events extends string> = {
  on<E extends Events>(event: E, handler: (name: E) => void): void
}
declare const emitter: Emitter<"open" | "close">
emitter.on("open", (name) => {
  const literal: "open" = name   // the handler knows which event it is
})
// emitter.on("nope", () => {})  // TS2345

// ---------------------------------------------------------------------------
// CSS-in-JS, which is the other real use
// ---------------------------------------------------------------------------
type Unit = "px" | "rem" | "em" | "%"
type Size = `${number}${Unit}`

const w1: Size = "100px"
const w2: Size = "1.5rem"
// const w3: Size = "100"     // TS2322, no unit
// const w4: Size = "100pxx"  // TS2322

// Note this is *validation*, not autocomplete. The number part is still `any`
// number, so "99999rem" passes. Narrowing the numeric side means a recursive
// parse, which is where you will meet the depth limit.

// ---------------------------------------------------------------------------
// Template literal types versus `as const`
// ---------------------------------------------------------------------------
// They solve different problems and are often used together.
//
//   as const       - freezes one value:        { kind: "circle" }
//   template type  - describes a family:       `on${Capitalize<E>}Change`
//
// `as const` on an object with a template-typed field will not work - `as
// const` produces literal types, not template types. To get the family, the
// field has to be *declared* with a template literal type.

type Kind = "circle" | "square"
type ShapeSpec<K extends Kind> = { kind: `get${Capitalize<K>}Shape`; returns: K }
const s1: ShapeSpec<"circle"> = { kind: "getCircleShape", returns: "circle" }
// const s2: ShapeSpec<"circle"> = { kind: "getCircleShape", returns: "square" }
//   TS2322. The two fields are tied together, which is the point.

// ---------------------------------------------------------------------------
// What you cannot do
// ---------------------------------------------------------------------------
// - No arithmetic, no case conversion beyond the intrinsic helpers.
// - No evaluation. There is no "count the characters" in a template literal
//   type; you need a recursive conditional plus a tuple accumulator, and you
//   will hit the depth limit on real input.
// - Intrinsics are limited to Capitalize, Uncapitalize, Uppercase, Lowercase
//   and, in newer versions, `NoInfer`. Each is a full string operation
//   performed by the checker, so they are not free on huge unions.
console.log(hook, h1, path, p1, p2, parts, w1, w2, emitter, s1, navigate)
export type { Event, Handler, Hook, Path, Split, Parts, TrimSlash, Trimmed, TrimBoth, TB, ExtractParams, Route, Params, Emitter, Unit, Size, Kind, ShapeSpec }
