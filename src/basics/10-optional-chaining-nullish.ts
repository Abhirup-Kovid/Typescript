// Optional chaining and nullish coalescing are runtime operators, but they
// change types in ways that are worth being precise about.

type Draft = {
  title: string
  author?: { name: string; contact?: { email?: string } }
}

const draft: Draft = { title: "Masala" }

// `?.` short-circuits to `undefined` the moment the value is null or
// undefined, and it *stops the whole chain*.
const email = draft.author?.contact?.email
// email: string | undefined
//
// The type is the union of every step's output with `undefined` added at
// each optional hop. So even a fully populated object leaves `undefined` in
// the type: the compiler cannot know it is populated.

const emailLength = draft.author?.contact?.email?.length
// emailLength: number | undefined
// Without the `?.` before `length`, this is TS18048:
//   'draft.author' is possibly 'undefined'.

// ---------------------------------------------------------------------------
// ?. versus &&
// ---------------------------------------------------------------------------
// Both stop the access, but they are not interchangeable.
//   draft.author && draft.author.name.length
// When `author` is undefined this yields `undefined` (falsy) rather than
// crashing, which works - but if `author.name` were the empty string it
// would also short-circuit and hand you `""` where you expected a name.
// `?.` only short-circuits on null and undefined, which is almost always the
// intent.

// ---------------------------------------------------------------------------
// ?? versus ||
// ---------------------------------------------------------------------------
// This is the one people get wrong in production code.
const zero = 0
const empty = ""
const missing: null = null

const withOr = zero || 100
// withOr: number -- 100. `0` is falsy, so || replaced it. If `zero` meant
// "zero cups", the answer is now wrong.

const withNullish = zero ?? 100
// withNullish: 0 -- ?? only falls through on null and undefined.

const orEmpty = empty || "default"
const nullishEmpty = empty ?? "default"
// both are "default", but for different reasons. The reason they agree here
// is a coincidence, and relying on it is how `??` gets swapped for `||` by
// someone who "knows better".

const orNull = missing || "fallback"
const nullishNull = missing ?? "fallback"
// both "fallback" -- ?? handles null explicitly.

function readSetting(raw: string | undefined): string {
  return raw ?? "fallback"
}
const fromUndefined = readSetting(undefined)

// ---------------------------------------------------------------------------
// Assignment forms
// ---------------------------------------------------------------------------
// `??=` and `||=` only assign when the current value is nullish / falsy.
let retries = 0
retries ||= 3
// retries: 3 -- ||=, so the 0 was overwritten

let attempts: number | undefined
attempts ??= 1
// attempts: 1

// The useful case: a default that must not clobber a legitimate falsy value.
let configuredPort: number | undefined = 0
configuredPort ??= 8080
// configuredPort: 0, not 8080. Correct.

// ---------------------------------------------------------------------------
// strictNullChecks interaction
// ---------------------------------------------------------------------------
// Everything above depends on `strictNullChecks`, which is part of `strict`.
// Turn it off and `string | undefined` collapses to `string`, `?.` becomes
// pointless, and the compiler will happily let you dereference a missing
// property. It is the single most important flag in the whole set.

console.log(email, emailLength, withOr, withNullish, orEmpty, nullishEmpty, orNull, nullishNull, fromUndefined, retries, attempts, configuredPort)
