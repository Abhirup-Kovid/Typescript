// `as const`, `satisfies`, and `const` type parameters: three tools for
// "keep the precise type, but check it".

// ---------------------------------------------------------------------------
// as const
// ---------------------------------------------------------------------------
// `as const` turns off widening for the whole literal expression, recursively.
// Three things it does: no widening to the base primitive, `readonly` on every
// property, and literal types on every value.
const cfg = {
  host: "localhost",
  port: 8080,
  tags: ["a", "b"],
  nested: { debug: true },
} as const
// { readonly host: "localhost"; readonly port: 8080; readonly tags:
//   readonly ["a", "b"]; readonly nested: { readonly debug: true } }

const port: 8080 = cfg.port   // ok - the literal survived
// const wrong: 3000 = cfg.port   // TS2322
// cfg.port = 1   // TS2540

// Without `as const`, the same object is:
// { host: string; port: number; tags: string[]; nested: { debug: boolean } }
// Every literal widened, because the object is mutable.

// `as const` is the tool for "I want the literal values, do not widen".
// `satisfies` is the tool for "check this shape, keep what the compiler
// inferred". They are not alternatives.

// ---------------------------------------------------------------------------
// satisfies
// ---------------------------------------------------------------------------
type Config = {
  host: string
  port: number
  tags: string[]
}

const good = {
  host: "localhost",
  port: 8080,
  tags: ["a"],
} satisfies Config
// Inferred type: { host: string; port: number; tags: string[] }
// Errors a plain annotation would also give, PLUS excess property checking.

// Each of these produces a different error, and all three are caught at the
// declaration site rather than at first use:
//
//   const bad = {
//     host: "localhost",
//     port: "8080",   -> TS2322, string is not number
//     tags: [],
//     extra: true,    -> TS2353, excess property
//   } satisfies Config
//
//   const missing = { host: "h", tags: [] } satisfies Config
//   -> TS2741: Property 'port' is missing
const bad = {
  host: "localhost",
  port: 8080,
  tags: [],
} satisfies Config

// ---------------------------------------------------------------------------
// satisfies versus an annotation: the actual difference
// ---------------------------------------------------------------------------
const annotated: Config = { host: "h", port: 1, tags: [] }
// annotated is *Config*. Anything downstream sees Config - the specific
// literal types are gone.

const satisfied = { host: "h", port: 1, tags: [] } satisfies Config
// satisfied is { host: string; port: number; tags: string[] } - the *widened*
// inferred type, and it is checked against Config. Same guarantee, and the
// real type survives for tooltips and further inference.

// The case where it matters: a value that must satisfy a shape but whose
// narrow type must not be widened to that shape.
const base = { x: 1, y: 2 }
const asConfig: { x: number; y: number } = base   // base stays number
const asSatisfies = { x: 1, y: 2 } satisfies { x: number; y: number }
// asSatisfies.x is `1`, the literal.
//
// The genuinely load-bearing version, where a value keeps its own type while
// being verified against a wider contract:
type Palette = Record<string, `#${string}`>

const colors = {
  primary: "#fff",
  danger: "#f00",
} satisfies Palette
// colors.primary is "#fff", not string. With `const colors: Palette` you
// would get `string` and lose the ability to detect a later mistake.

// `satisfies` also accepts an expression, not just a literal:
function makeConfig() {
  return { host: "h", port: 1, tags: [] } satisfies Config
}

// ---------------------------------------------------------------------------
// The three-way comparison
// ---------------------------------------------------------------------------
//   annotation  `const x: T = v`
//     - result is T. Precise, but the value's own type is erased.
//     - use when T *is* the contract you want to publish.
//
//   as const    `const x = v as const`
//     - result is the deepest literal type. No contract checked at all.
//     - use to freeze a value's type precisely.
//
//   satisfies   `const x = v satisfies T`
//     - result is the inferred type, checked against T. Both, but the
//       inferred type wins for downstream use.
//     - use when you want the check *and* the precision.
//
// They compose, with a caveat: `as const satisfies T` gives you the literal
// type *and* the check, and it is the right combination when the shape is
// fixed. `satisfies` after `as const` also works; the order does not matter
// for the resulting type.
//
//   const x = { ... } as const satisfies Palette

// ---------------------------------------------------------------------------
// const type parameters (TS 5.0)
// ---------------------------------------------------------------------------
// Before it, you had to write `as const` at every call site to get literal
// inference through a function. Now the function can ask for it.
function identity<const T>(value: T): T {
  return value
}

const a = identity("chai")
// a is "chai", not string. Without `const`, it would be string.

const b = identity({ port: 8080 })
// b is { port: 8080 } rather than { port: number }.

const c = identity([1, 2])
// c is readonly [1, 2] rather than number[].

function tuple<const T extends readonly unknown[]>(...args: T): T {
  return args
}
const t = tuple("a", 1, true)
// t is readonly ["a", 1, true] - positionally precise, and you did not write
// `as const` anywhere. That is the ergonomic win: the call site reads like
// ordinary code.
//
// The trade-offs:
//   - it is a *change* to the signature. Existing callers that relied on
//     widening now get literal types, which can make a downstream `let`
//     assignment fail with TS2322. Hence a major-ish version, and hence the
//     ability to remove it per-parameter with `<const T>` vs `<T>` at each
//     call.
//   - literal types are wider unions than you want in hot generic code. For
//     something called in a loop, `const` inference can make the checker's
//     work noticeably larger.

// ---------------------------------------------------------------------------
// NoInfer
// ---------------------------------------------------------------------------
// The opposite lever: block inference at a position, so a parameter falls
// back to its declared type or its constraint instead of contributing to
// inference. Useful when an argument is only there for validation.
function store<T>(value: T, validate: (v: T) => boolean): T {
  return validate(value) ? value : (value as T)
}
// With `validate: (v: NoInfer<T>) => boolean`, passing a different function
// shape cannot change the inferred T. Introduced in TS 5.4.

console.log(cfg, port, good, makeConfig(), a, b, c, t, colors, store, bad)
export type { Config, Palette }
