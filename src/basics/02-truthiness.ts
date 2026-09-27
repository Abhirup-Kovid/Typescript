// boolean is one type, but truthiness is a *runtime* question with a
// fixed, small answer set. Keeping the two apart avoids a whole class of bug.

const isFalsy = (value: unknown): boolean => {
  if (value) {
    return false
  }
  return true
}

// The complete falsy set. There is no "everything else" subtlety here, which
// is exactly why the list is worth memorising.
const FALSY: ReadonlyArray<unknown> = [false, 0, -0, 0n, "", null, undefined, NaN]

function describeTruthiness(value: unknown): string {
  // `if (value)` narrows out the falsy members when the type is a union that
  // contains them. On `unknown` it cannot narrow to anything useful, which is
  // precisely why `unknown` forces an explicit check.
  return value ? "truthy" : "falsy"
}

// The trap: an empty string is falsy, a space is truthy.
const empty = ""
const blank = " "
const zero = 0

// `if (name)` on a `string | undefined` removes `undefined` (and `""`), so
// inside the block `name` is `string` -- but it can still be empty. A
// truthiness check is not a non-empty check.
function badge(name: string | undefined): string {
  if (name) {
    return name.length > 0 ? `badge: ${name}` : "badge: (blank)"
  }
  return "no badge"
}

// `!!x` is the idiomatic double-negation to force a boolean. It is needed
// when a value is truthy/falsy but typed as something wider than boolean.
function isAdmin(value: object | null | undefined): boolean {
  return !!value
}

console.log(
  describeTruthiness(empty),
  describeTruthiness(blank),
  describeTruthiness(zero),
  badge(""),
  badge("ravi"),
  badge(undefined),
  isAdmin(null),
  isAdmin({}),
  FALSY.map(describeTruthiness),
)
