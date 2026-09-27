// An assertion function is a predicate that narrows on the *success* path and
// is allowed to have no return value at all. It is what you reach for when
// "this must be true, or the program is broken" is the honest model.

function assertDefined<T>(value: T | undefined, label: string): asserts value is T {
  if (value === undefined) {
    throw new Error(`expected ${label} to be defined`)
  }
}

// A `function` declaration is the form that just works at the call site.
function portOf(env: Record<string, string | undefined>): number {
  const raw = env["PORT"]
  assertDefined(raw, "PORT")
  return Number(raw)
  // raw is `string` here, not `string | undefined`. An assertion narrows the
  // rest of the enclosing scope, unlike a plain guard, because the failure
  // path throws rather than continuing.
}

// ---------------------------------------------------------------------------
// The restriction that catches everyone: TS2775
// ---------------------------------------------------------------------------
// "Assertions require every name in the call target to be declared with an
// explicit type annotation."
//
// So this does NOT narrow:
const assertStringArrow = (value: unknown): asserts value is string => {
  if (typeof value !== "string") throw new Error("not a string")
}

function notNarrowed(value: unknown): number {
  // assertStringArrow(value)
  // -> TS2775: Assertions require every name in the call target to be
  //    declared with an explicit type annotation.
  //
  // The call is left commented out precisely because the compiler rejects it.
  // If it did compile, `value` would still be `unknown` here and
  // `value.length` would be an error - which is the whole point of the rule.
  return 0
}

// ...while this one does:
const assertStringTyped: (value: unknown) => asserts value is string =
  (value): asserts value is string => {
    if (typeof value !== "string") throw new Error("not a string")
  }

function narrowed(value: unknown): number {
  assertStringTyped(value)
  return value.length
}
console.log(notNarrowed("x"), narrowed("chai"))

// and the un-annotated arrow is rejected at the call site, not at the
// declaration:
//   notNarrowed("x")
//   -> TS2775: Assertions require every name in the call target to be
//      declared with an explicit type annotation.
//
// That is a genuinely annoying rule, and it is the single most common reason
// a working assertion function "stops narrowing" after a refactor - someone
// converts the declaration to `const f = (...) => {}` and the call site
// silently stops narrowing, usually without a new error appearing at all if
// the body no longer needs the narrower type.

// ---------------------------------------------------------------------------
// The bare `asserts condition` form
// ---------------------------------------------------------------------------
function assertIsDefined(value: unknown): asserts value {
  if (value === undefined || value === null) {
    throw new Error("assertion failed")
  }
}

// `asserts value` means "after this call, value is not nullish". It does not
// tell you a type, only that a check happened.
function nonNullishLength(value: string | null | undefined): number {
  assertIsDefined(value)
  return value.length  // string, because undefined | null were removed
}

// ---------------------------------------------------------------------------
// You can only assert on identifiers, never on property access
// ---------------------------------------------------------------------------
type Response = { data?: string }

function cannotAssertOnProperty(response: Response): number {
  // assertIsDefined(response.data)  ->  TS2776: assertions require every name
  //   in the call target to be declared with an explicit type annotation.
  // Actually the error here is different: you may not assert on a property.
  //   TS2677: A type predicate's type must be assignable to its parameter's
  //   type. The fix is always the same: capture it in a const first.
  const { data } = response
  assertIsDefined(data)
  return data.length
}

// ---------------------------------------------------------------------------
// Assertions compose into a validation layer
// ---------------------------------------------------------------------------
function assertAllDefined<T extends Record<string, unknown>>(input: T): T {
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      throw new Error(`missing required key: ${key}`)
    }
  }
  return input
}

const config = assertAllDefined({ host: "localhost", port: 8080 })

// ---------------------------------------------------------------------------
// Where to stop
// ---------------------------------------------------------------------------
// Assertions are excellent at the boundary of untrusted data: one function
// that throws, everything downstream treats the value as proven. They are a
// poor fit for control flow inside business logic, where a union plus a
// normal guard reads better and cannot throw halfway through.
//
// Rule of thumb: assert at the edge, narrow in the middle.

console.log(portOf({ PORT: "8080" }), nonNullishLength("chai"), cannotAssertOnProperty({}), config)
export { portOf, nonNullishLength, assertIsDefined, assertStringTyped, assertStringArrow }
