// A tuple is a fixed-length array where each position has its own type.
// `T[]` says "N of T, any N". A tuple says "exactly this, in this order".

type Coordinates = [x: number, y: number]

const origin: Coordinates = [0, 0]
// origin.push(1)     ->  TS2554: Property 'push' does not exist on type Coordinates
// origin[0] = "0"    ->  TS2322: string is not assignable to number

const [x, y] = origin
// x and y are `number`, not `number | undefined`, because the length is known.

const alsoReadonly: readonly [number, number] = [1, 2]
// alsoReadonly[0] = 9   ->  TS2540: Cannot assign to '0' because it is a
//                          read-only property

// Optional elements and rest elements. The optional one, if present, must be
// last before the rest.
type Line = [start: Coordinates, end: Coordinates, label?: string]
type Scores = [name: string, ...points: number[]]

const line: Line = [[0, 0], [10, 10]]
const lineLabelled: Line = [[0, 0], [10, 10], "diagonal"]
const scores: Scores = ["ravi", 90, 80, 70]

// A rest element can be empty, an optional element can be omitted, and the
// two compose. What you cannot do is put a required element after an
// optional one -- that would be a hole the compiler could not describe.

// ---------------------------------------------------------------------------
// Optional tuple elements and exactOptionalPropertyTypes
// ---------------------------------------------------------------------------
// `[string, number?]` means the second slot may be absent, or hold a number.
// Reading it is still `number | undefined` unless you destructure with a
// default or check `length`:
//   const [, second] = lineLabelled   // second: number | undefined
//   const [, second = 0] = lineLabelled  // second: number

// ---------------------------------------------------------------------------
// When a tuple is the right tool
// ---------------------------------------------------------------------------
// 1. A fixed-shape positional record: coordinates, RGB, an [x, y] drag delta.
// 2. A return value that is "a value and why it failed" instead of a
//    two-field object nobody destructures.
// 3. Paired data that must stay together after a `map`.

type ParseResult = [ok: true, value: number] | [ok: false, reason: string]

function parsePort(input: string): ParseResult {
  const parsed = Number(input)
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return [true, parsed]
  }
  return [false, "port must be a positive integer below 65536"]
}

const port = parsePort("8080")
if (port[0]) {
  console.log(port[1]) // narrowed to number
}

// Destructuring a discriminated tuple narrows too, because the discriminant is
// the first element:
const [ok, payload] = port
if (ok) {
  console.log(payload) // number
} else {
  console.log(payload) // string
}

// A tuple is the honest alternative to an array of "maybe A maybe B", which
// is what a `map` callback returning a union usually produces. If you find
// yourself writing `const result: (string | number)[]`, a named tuple is
// usually what you were trying to say.

export { origin, x, y, alsoReadonly, line, lineLabelled, scores, port, ok, payload }
export type { Coordinates, Line, Scores, ParseResult }
