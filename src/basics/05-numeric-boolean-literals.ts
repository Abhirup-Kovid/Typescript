// Literal types are not specific to strings.

// Numeric literal types. Useful when the *value* is part of the contract:
// dice, HTTP status codes, retry counts, semver.
type Dice = 1 | 2 | 3 | 4 | 5 | 6
type HttpStatus = 200 | 201 | 204 | 400 | 401 | 404 | 500
type MaxRetries = 0 | 1 | 2 | 3

const roll: Dice = 4
// const rollAgain: Dice = 7   ->  TS2322

const retryCount: MaxRetries = 2

// Boolean literal types. Worth understanding mainly so that `true | false`
// does not look like a clever alternative to `boolean`:
//
//   type Toggle = true | false
//   let b: boolean = ...
//   let t: Toggle = b        // no error
//   let b2: boolean = t      // no error
//
// `boolean` is internally the union `true | false`, so the two are the same
// type with extra syntax. Write `boolean`. The literal forms earn their keep
// where you need a *subset* of boolean, or where `undefined`/`null` is the
// distinguishing member.
type TriState = boolean | undefined

let tri: TriState = true
tri = false
tri = undefined
// tri = 0    ->  error: no overlap between `number` and TriState

// `boolean | undefined` is not the same as optional-with-undefined under
// `exactOptionalPropertyTypes`:
type StrictFlag = { enabled?: true }
const strictOn: StrictFlag = { enabled: true }
// const strictMaybe: StrictFlag = { enabled: undefined }  ->  error with
//   exactOptionalPropertyTypes: "not assignable to type 'true'".
// The flag says "absent means off". It does not say "absent or undefined".

function describeRoll(value: Dice): string {
  switch (value) {
    case 1:
      return "one"
    case 6:
      return "six"
    default:
      return "middle"
  }
}

console.log(roll, retryCount, tri, strictOn, describeRoll(roll))
export type { Dice, HttpStatus, MaxRetries, TriState, StrictFlag }
