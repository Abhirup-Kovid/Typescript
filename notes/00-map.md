# Map of this repository

The learning path as it now stands, and what each directory is for. Read
top to bottom; each file assumes the one above it.

## `src/basics/` — the value layer

TypeScript's type system is only interesting once you know what it is
describing. Ten files on the primitives, literals, unions, arrays, tuples,
destructuring, and the two operators people misread most often.

- `01`–`02` primitives, truthiness, and the fact that the falsy set is
  `false | 0 | -0 | 0n | "" | null | undefined` plus `NaN`
- `03` inference vs annotation — the most consequential day-one decision
- `04`–`05` literal widening, and why `let x = "a"` is not `"a"`
- `06` unions, and what they do to `typeof`
- `07`–`08` arrays and tuples, and why `T[]` is not `T`
- `09`–`10` destructuring and optional chaining

## `src/narrowing/` — the control-flow layer

Where the type system stops describing values and starts *computing* on them.
Eight files, in the order the techniques unlock each other.

- `01` truthiness guards
- `02` `typeof`
- `03` `instanceof`
- `04` the `in` operator — the one that makes a union of objects work
- `05` discriminated unions, and why they are better than optional fields
- `06` type predicates, for when the compiler cannot see the relationship
- `07` assertion functions, so `if (assert(x))` narrows
- `08` exhaustiveness with `never`

## `src/functions/` — the abstraction layer

- `01`–`03` function types, parameter checking, call signatures
- `04` overloads, and their one real use (a default that depends on other
  parameters)
- `05`–`06` generics and constraints
- `07` the `this` parameter

## `src/oop/` — the modelling layer

- `01`–`04` classes, modifiers, parameter properties, accessors, statics
- `05`–`07` inheritance, `abstract`, and the instance-versus-constructor
  duality that `typeof Store` exposes
- `08` generic classes

## `src/types/` — the type system itself

Ten files on constructing types rather than describing values.

- `01` `type` vs `interface`
- `02` intersections
- `03` index signatures
- `04` `keyof` and `typeof`
- `05` mapped types
- `06` conditional types
- `07` `infer`
- `08` template literal types
- `09` the utility types
- `10` `as const`, `satisfies`, `const` type parameters

## `src/modules/` — packaging

- `chai-menu.ts` the exporting side
- `02` imports under NodeNext, and `verbatimModuleSyntax`
- `03` namespaces, and the one case where they are still correct

## `src/edges/` — the parts with no clean answer

- `01` `any` / `unknown` / `never`
- `02` assertions
- `03` enums, and the const-object pattern
- `04` promises and async
- `05` error handling, and `Result`

## `src/projects/chai-orders/` — everything at once

Four files that use all of the above on one domain: branded ids, an order as a
state-machine union, `Record` over a union for pricing, a generic repository,
`Result` instead of throws, and a route table whose handler arity is derived
from a template literal type.

Run it with `npx tsc && node dist/projects/chai-orders/index.js`.

## `notes/`

- `01`–`03` the mental model, narrowing, and functions, written as prose
- `04` cheatsheet, for recall
- `05` the compiler errors this project actually produced

## Configuration worth knowing

`strict` is on, which implies `strictNullChecks`, `noImplicitAny`,
`useUnknownInCatchVariables`, and `noImplicitThis`.

Also on, and each one changes code the day it is enabled:

| flag | what it forces |
|---|---|
| `noUncheckedIndexedAccess` | `arr[0]` is `T \| undefined`, because the index might be out of bounds |
| `exactOptionalPropertyTypes` | `{ port?: number }` rejects `{ port: undefined }`, so "absent" and "explicitly undefined" differ |
| `verbatimModuleSyntax` | type-only imports must say `import type`, and tsc removes the guesswork that erases them |
| `isolatedModules` | each file transpiles independently, so `const enum` and some type-only re-exports are out |
| `noUncheckedSideEffectImports` | a side-effect import must resolve to something with types |
| `moduleDetection: "force"` | every file is a module, so top-level `await` and a stray `export {}` behave predictably |

`noUncheckedIndexedAccess` is the flag that does the most work. It forces
"not found" to be handled rather than assumed away, and it is why
`Repository.find` returns `T | undefined` in the project.

Module setup is `module: nodenext` with `moduleResolution: nodenext`, which is
why local imports name the emitted `.js` file rather than the `.ts` source.

And `types: []`, which means no `@types` package is auto-included — so there
are no ambient globals at all. Files that need an external function declare it
locally with `declare function`, which keeps each file self-contained and
runnable on its own.
