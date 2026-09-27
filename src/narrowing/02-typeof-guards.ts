// `typeof` is the workhorse guard, and the only one that can reduce `unknown`.

type Primitive = string | number | bigint | boolean | symbol | undefined | null

// The complete set of values `typeof` can return, as a *type*:
type TypeOfResult =
  | "string" | "number" | "bigint" | "boolean" | "symbol"
  | "undefined" | "object" | "function"

function describe(value: Primitive): string {
  // The guard works because `typeof` in a comparison position is treated by
  // the compiler as a type-level function, not a call. `typeof x` has type
  // "the string literal 'string'", and comparing it against "number" lets the
  // compiler partition the union by exactly the same partition `typeof`
  // produces at runtime.
  switch (typeof value) {
    case "string":
      return value.toUpperCase()
    case "number":
    case "bigint":
      return value.toString()
    case "boolean":
      return value ? "yes" : "no"
    case "symbol":
      return value.toString()
    case "undefined":
      return "absent"
    case "object":
      // value is `null` here, and only null. See below.
      return "null"
    default:
      return "unreachable"
  }
}

// ---------------------------------------------------------------------------
// The null trap
// ---------------------------------------------------------------------------
// `typeof null === "object"`. This is a JavaScript fact that cannot be changed
// without breaking the web, so TypeScript bakes it in: a `case "object"` arm
// on a nullable union narrows to `null`, and nothing else.
//
// The consequence: `typeof x === "object"` is not a null check, and is not an
// "is it a real object" check. On `unknown` it means `object | null`.
//
// A `typeof` guard is a *type* narrowing, so a runtime function that returns
// the type name is the idiomatic bridge:
function isString(value: unknown): value is string {
  return typeof value === "string"
}

// ---------------------------------------------------------------------------
// unknown: the main use case
// ---------------------------------------------------------------------------
function parseJson(raw: string): unknown {
  // The honest signature for JSON.parse. It returns `any`, and the fix for
  // that is to accept `unknown` here and push the narrowing to the caller,
  // rather than to lie with `as` at the boundary.
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const parsed = parseJson('{"name":"masala"}')
if (isString(parsed)) {
  parsed.toUpperCase()
}

// ---------------------------------------------------------------------------
// typeof on arrays and functions: the gaps
// ---------------------------------------------------------------------------
type Anything = string[] | number[] | (() => void) | Record<string, unknown>

function whatIsIt(value: Anything): string {
  switch (typeof value) {
    case "object":
      // value is `string[] | number[] | Record<string, unknown>`. `typeof`
      // cannot separate arrays from plain objects, so `.length` is not
      // available without narrowing further. Use `Array.isArray` for that -
      // it is a real runtime check the compiler understands.
      return Array.isArray(value) ? `array of ${typeof value[0]}` : "object"
    case "function":
      return "callable"
    default:
      return "other"
  }
}

console.log(
  describe("chai"),
  describe(null),
  describe(undefined),
  whatIsIt([1, 2]),
  whatIsIt(() => undefined),
  whatIsIt({ a: 1 }),
  parsed,
)
export type { TypeOfResult }
