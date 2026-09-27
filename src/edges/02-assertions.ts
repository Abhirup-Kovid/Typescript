// Type assertions: telling the compiler to take your word for it.
//
// An assertion is not a conversion and not a check. It is a claim the compiler
// stops verifying. `x as T` succeeds whenever T is a subtype or a supertype of
// the type of x - the "sufficient overlap" rule - and nothing more.

declare const raw: unknown
const asString = raw as string     // allowed: unknown is comparable to string
const asNumber = raw as number
const asBoth = "5" as string | number

// ---------------------------------------------------------------------------
// The double cast, and what it is for
// ---------------------------------------------------------------------------
// When the types have no overlap at all, you need two hops through an
// intermediate. This is the escape hatch of last resort, and the reason it
// is written awkwardly is so that grep finds every use.
const asAnything = raw as unknown as string

// Legitimate uses:
//   - Collapsing a union you have just narrowed for runtime reasons.
//   - Getting past a library's too-narrow return type.
//   - A generic you cannot constrain, where you have checked the caller.
//
// Illegitimate uses, in rough order of how often they appear in review:
//   - Silencing an error you have not understood.
//   - Asserting a type on data from a source you do not control, with no
//     runtime check next to it. This is the one that produces production
//     incidents, because the type is the only thing that was ever true.
//   - `as const` on a mutable object, then being surprised it is readonly.

// ---------------------------------------------------------------------------
// `as const`, which is an assertion with a fixed meaning
// ---------------------------------------------------------------------------
// It takes the literal type of the expression, recursively, and marks it
// readonly. This one is safe, because the compiler computes the type from the
// expression rather than you asserting it.
const literal = "chai" as const       // "chai"
const frozen = { host: "h", port: 8080 } as const
// { readonly host: "h"; readonly port: 8080 }

const port: 8080 = frozen.port
// const wrong: 3000 = frozen.port   // TS2322

// A cast that does not narrow to the value's own type is the warning sign.
//   "5" as unknown as number   // compiles, and is false at runtime
//   "5" as never               // compiles. Always. Means nothing.

// ---------------------------------------------------------------------------
// A cast with a runtime check beside it
// ---------------------------------------------------------------------------
// This is the only pattern that makes a cast defensible, and the check is not
// optional - without it you have a comment where a guard should be.
function parsePort(value: string | number): number {
  if (typeof value === "number") return value
  // `Number(...)` is `number`, so the cast is a no-op, but the *pattern* is
  // what matters: a runtime operation, then a type operation, then an
  // assertion only where the operation's type is imprecise.
  return Number(value)
}

function lengthOf(data: Record<string, unknown> | null): number {
  if (!data) return 0
  const values = Object.values(data)
  // `Object.values` on `Record<string, unknown>` is `unknown[]`. We want
  // strings. Narrow, do not assert.
  const strings = values.filter((v): v is string => typeof v === "string")
  return strings.reduce((total, s) => total + s.length, 0)
}

function badLengthOf(data: Record<string, unknown> | null): number {
  if (!data) return 0
  // The tempting version. It compiles, it returns 0 at runtime for a value
  // that is a number, and the type system will never mention it again.
  return (Object.values(data) as string[]).length
}

// ---------------------------------------------------------------------------
// Non-null assertion
// ---------------------------------------------------------------------------
// The `!` suffix removes `null` and `undefined` from a type.
declare const maybe: string | undefined

const forced = maybe!.length   // string
// Use it when a check has already happened that the compiler cannot see, and
// only then. Every `!` is an unchecked runtime dereference, and each one is a
// line the compiler stopped guarding.
//
// `strictNullChecks` being on is what gives the assertion something to
// remove. With it off there is nothing to assert away and the operator is
// meaningless.

// ---------------------------------------------------------------------------
// Definite assignment
// ---------------------------------------------------------------------------
// `let x!: T` tells the compiler the assignment happens somewhere it cannot
// see - a constructor, a framework, a test fixture. Same deal as `!`: a
// promise, checked nowhere.

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------
// An assertion is a comment that the compiler enforces. That is genuinely
// useful - it is a machine-checked comment - and it stops being useful the
// moment the comment is wrong.
//
// So the test is: if the claim turned out to be false, would the next line
// fail loudly and obviously, or would it quietly produce a wrong value? Quiet
// wrong values are the reason to write a guard instead.
console.log(asString, asNumber, asBoth, asAnything, literal, frozen, port, parsePort("1"), lengthOf({}), badLengthOf({ a: 1 }), forced)
