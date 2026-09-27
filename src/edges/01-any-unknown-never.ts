// any, unknown, never. Three types that exist for three different reasons,
// and choosing wrongly between `any` and `unknown` is the single most
// consequential decision in this file.

declare const a: any
declare const u: unknown

// ---------------------------------------------------------------------------
// any: opting out
// ---------------------------------------------------------------------------
// Every operation is permitted, and - this is the part that matters - the
// `any` *propagates*. It is assignable to everything, and everything is
// assignable to it.
const toString: string = a          // any -> string, unchecked
// const toNumber: number = u      // TS2322, and that is the whole point

// Contagion, concretely: one `any` in an expression disables checking for the
// whole expression.
//   const n: number = JSON.parse(raw) + 1
// `JSON.parse` returns `any`, so the addition is `any`, so assigning to number
// checks nothing. A typo in a property name two calls deep is invisible.

// `any` in a parameter position is worse, because of contravariance: `any` is
// assignable in both directions, so a single `any` parameter disables the
// check for the whole signature and for every function assigned to it.

// ---------------------------------------------------------------------------
// unknown: honesty
// ---------------------------------------------------------------------------
// Assignment in, nothing out. Anything can be assigned *to* it; nothing can
// be done with it until narrowed.
// u.toUpperCase()   -> TS18046: 'u' is of type 'unknown'
// a.toUpperCase()   -> fine, and that is the problem

// The asymmetry, in one line:
//   any     accepts assignment, permits any operation, contagious
//   unknown accepts assignment, permits no operation, contained
//
// Use `unknown` by default for genuinely unknown values - JSON.parse, catch
// clauses, form input, message payloads - and narrow before use.

// Narrowing `unknown` needs a guard, and the guard is usually a type
// predicate, because `typeof` alone will not get you a usable type.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

if (isRecord(u)) {
  console.log(Object.keys(u))
}

// ---------------------------------------------------------------------------
// never: the empty type
// ---------------------------------------------------------------------------
// `never` is the set of no values. It is a subtype of every type and no value
// is assignable to it - not even `undefined`.
//
// Three uses, in descending order of how often you will need them.

// 1. "This function never returns."
function fail(message: string): never {
  throw new Error(message)
}

// 2. "This switch is total, and I want the compiler to prove it."
type Status = "queued" | "brewing" | "served"

function next(status: Status): Status {
  switch (status) {
    case "queued":
      return "brewing"
    case "brewing":
      return "served"
    case "served":
      return "queued"
    default: {
      // `status` is `never` here. This is a compile error the moment someone
      // adds a fourth status, and it names the exact case they forgot.
      const unreachable: never = status
      return unreachable
    }
  }
}

// 3. "This function always throws, so everything after it is unreachable."
//    (The more common real use of `never` is in the exhaustiveness check
//    above. This one is here because the natural way to write it is a trap.)

function guard(fn: () => void): void {
  try {
    fn()
  } catch (error: unknown) {
    // The instinct here is `catch (error: never)` - "no ordinary error escapes
    // this function, so the thrown value is not one I modelled". TypeScript
    // refuses, and the refusal is the lesson:
    //
    //   TS1196: Catch clause variable type annotation must be 'any' or
    //           'unknown' if specified.
    //
    // `never` is not permitted in a catch clause, and it could not be useful
    // if it were: you can narrow `unknown` to whatever you handle, but you
    // cannot exhaustively narrow it to `never`, because someone is allowed to
    // `throw "a string"` from plain JavaScript. `unknown` is the only correct
    // annotation, and the default with `useUnknownInCatchVariables` (on under
    // `strict`) is already that.
    report(error)
  }
}

function report(error: unknown): void {
  if (error instanceof Error) console.log(error.message)
  else console.log(String(error))
}

// ---------------------------------------------------------------------------
// The `never` inference rule, which is the surprising one
// ---------------------------------------------------------------------------
// A function with no return statements and no return type annotation infers
// `void`, not `never`.
//   function f() {}          // void
//   function g(): never {}   // never, but the body cannot actually complete
//
// And an empty array literal infers `never[]` under a strict config, which is
// why `const x = []` then `x.push("a")` fails - `never` accepts nothing, so
// there is no valid first element. The fixes are an annotation, `as const`, or
// `Array<T>` with a type argument. `any[]` is the old behaviour and is why
// empty arrays used to be untyped.

// ---------------------------------------------------------------------------
// Choosing between them
// ---------------------------------------------------------------------------
//   unknown - the type of a value you do not know yet, and will narrow.
//             Default for anything from outside your program.
//   any     - only when you genuinely cannot express a constraint, and you
//             have checked that a generic would not do. Prefer `as` at a
//             single boundary instead: it is visible, where `any` is silent.
//   never   - "this cannot happen", in a return position, an unreachable
//             branch, or an exhaustiveness check.
//
// `any` is contagious and `unknown` is contained; that single sentence is the
// whole argument, and it is why a codebase that reaches for `any` gets
// progressively less checked the more it uses it.

console.log(toString, next("queued"), guard, fail)
