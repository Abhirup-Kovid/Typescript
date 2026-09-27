// Truthiness narrowing: `if (x)` removes the falsy members of a union.

type Menu = {
  name: string
  price: number
  discount?: number   // note: `number`, and 0 is a legitimate value
}

declare const menu: Menu | undefined

function total(menu: Menu | undefined): number {
  if (!menu) {
    return 0
  }
  return menu.price - (menu.discount ?? 0)
}

console.log(total(menu))

// What `if (x)` actually removes depends on the union's contents.
const t1: string | undefined = undefined
if (t1) {
  // t1 is `string` here. Both "" and undefined are removed.
}

const t2: 0 | 1 | undefined = 0
if (t2) {
  // t2 is `1`. 0 is removed too, which is correct but is the thing to watch:
  // if 0 were a meaningful value, a truthiness check is the wrong guard.
}

const t3: "" | "brew" | undefined = ""
if (t3) {
  // t3 is "brew"
}

// ---------------------------------------------------------------------------
// The explicit nullish check, and the loose-equality trick
// ---------------------------------------------------------------------------
function looseIsSet(value: string | number | null | undefined): boolean {
  // Loose `!= null` is true only for null and undefined, so it removes both
  // arms in one check. It does NOT remove "" or 0, which is exactly what
  // "is this set" usually means. Written this way on purpose.
  return value != null
}

function looseIsSetNotEqual(value: string | number | null | undefined): value is string | number {
  return value != null
}

function strictIsSet(value: string | number | null | undefined): boolean {
  // Strict `!== null` removes only null. undefined survives, and you have to
  // handle it. This asymmetry is why `!= null` is the more common idiom even
  // though linters flag it.
  return value !== null
}

// ---------------------------------------------------------------------------
// The one-narrowing-per-branch limit
// ---------------------------------------------------------------------------
// A value can be narrowed by at most one check per control-flow path. After
// `if (x)`, an `else if` on the *same* variable is a second check on a
// different path, which is fine - but the following is not:
//
//   if (typeof x === "string") { ... }
//   if (typeof x === "number") { ... }   // error: x is never number here,
//                                        // because path 1 already settled it
//
// Use `else if`, or switch, or return early. Early return is usually the
// cleanest: it makes each subsequent check a genuinely new path.

function label(value: string | number | boolean | null): string {
  if (value === null) return "nothing"
  if (typeof value === "string") return `text:${value}`
  if (typeof value === "number") return `num:${value}`
  return `flag:${value}`
}

// ---------------------------------------------------------------------------
// `unknown` and truthiness
// ---------------------------------------------------------------------------
// On `unknown`, a truthiness check narrows to `{}` - it removes `null` and
// `undefined` and learns nothing else, because `unknown` has no members to
// remove. It is not useless (it does get you past the null check) but it is
// much weaker than it looks.
function unknownTruthy(value: unknown): boolean {
  return Boolean(value)
}

// ---------------------------------------------------------------------------
// Truthiness and functions
// ---------------------------------------------------------------------------
declare const maybeCallback: (() => void) | undefined

function runTwice(cb: (() => void) | undefined): void {
  // A truthiness check on a function is an existence check: every function is
  // truthy, so this only removes undefined. `cb?.()` would be equivalent and
  // shorter, but the explicit form documents that the call is conditional.
  if (cb) {
    cb()
    cb()
  }
}

runTwice(maybeCallback)
console.log(looseIsSet(0), looseIsSetNotEqual(0), strictIsSet(0), label(null), unknownTruthy(1))
