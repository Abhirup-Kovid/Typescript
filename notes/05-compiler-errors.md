# Compiler errors I actually hit

Written from the errors this project produced, not from a reference. The
code is the most useful part, so most of these are written the way that fails.

## Assignability

### TS2322 — not assignable

The message is dense but structured. Read it right to left: the *target* type
first, then the source, then the specific property that failed, then the
deepest mismatching part of it.

```ts
const toNumber: number = unknownValue
// Type 'unknown' is not assignable to type 'number'.
```
This one is the good case — `unknown` refusing to be used un-narrowed is the
feature, not a limitation.

### TS2411 / TS2322 — index signature

```ts
interface Config { [key: string]: string; version: number }
// Property 'version' of type 'number' is not assignable to 'string' index type 'string'
```
Every *named* property must be assignable to the index signature's value type.
The follow-on TS2322 at each assignment mentions an "index signature" that most
people did not realise they wrote. Fix: a union value type.

### TS7053 — implicit any from index

`SUGAR_PRICE[0.25]` on a `Record<0 | 0.5 | 1, number>`. Numeric record keys
are checked by *value*, and noImplicitAny rejects the lookup.

### TS2739 / TS2741 — missing properties

`{ host, tags } satisfies Config` where `port` is required. TS2739 is "missing
the following properties", TS2741 is "property X is missing" for a single one.
Both fire at the declaration, which is the argument for `satisfies` over
checking at first use.

## Unions and narrowing

### TS2339 — property does not exist

`const toString: string = a` where `a: any` is fine; the same read on a union
arm that lacks the property is TS2339. This is also what you get from
`r.error.kind` when `r` is `Result<T, E>` and you have not checked `r.ok` —
`?.` is for types that say "may be absent", not for skipping narrowing.

### TS2678 — not comparable

`case "small":` against a `Size` that is a numeric enum. The switch compares
literals, the union holds numbers, and nothing overlaps.

### TS18046 — 'x' is of type 'unknown'

The unknown-is-not-narrowed error. Distinct from TS2571 in older versions.

### TS1196 — catch clause variable type

`catch (error: never)` is rejected; only `any` or `unknown` are permitted, and
it is correct — you cannot exhaustively narrow `unknown`, because JavaScript
can `throw "a string"`.

## Generics and constraints

### TS2345 — argument not assignable to parameter

Brands working: `takesOrderId(customerId("c-1"))`. Both are strings, so only
the brand distinguishes them.

### TS2322 — with "not assignable to type never"

`const unreachable: never = order` where `order: Order`. Exhaustiveness failed
because the switch was on a *different* variable. This is the mistake I made
in `src/projects/chai-orders/index.ts` and the reason that note exists.

### TS2554 — expected N arguments

The route table: `handle("/orders/:id/price")` is TS2554 because the path
declares a parameter. Arity derived from a string.

### TS2551 / TS2353 — excess property

Only for *fresh* object literals. Assign a variable first and the check
disappears — which is why `satisfies` is better than an annotation for
catching a stray field.

## Type-level

### TS2589 — instantiation excessively deep

Either genuine infinite recursion (a conditional type with no base case, e.g.
`Split<S, Sep>` without a terminal `never`) or a legitimately deep type. The
message names neither the type nor the depth, so the diagnostic habit is
"binary-search the type" rather than "read the message".

### TS2567 — enum can only merge with namespace or enum

`enum Size` and `type Size` in one scope. The enum occupies the name in both
the type and value space, so a type alias cannot also have it.

### TS1064 — return type of an async function must be a Promise

`async function f(): number`. Correct: the function always returns a promise.

### TS2846 — interface can only extend an object type

`interface Bad extends Status {}` where `Status` is a union. An interface names
an object type; it cannot be one of several.

### TS5097 — import path can only end with a recognised extension

`import "./chai-menu.ts"` under NodeNext. Use `.js` — the emitted filename.

## The ones worth knowing by code alone

- **TS2322 on a numeric enum with an arbitrary number** — used to be legal
  through 4.9, rejected since 5.0 when every enum member became a literal
  member. Numeric enums are now closed.
- **`catch (e: never)`** — not allowed, and the reasoning is the lesson.
- **`never` accepts nothing**, including `undefined`. A conditional resolving
  to `never` is a compile error, not a wildcard.
- **Promises are invariant** — `Promise<Sub>` is not assignable to
  `Promise<Super>`, so a "might be missing" function must be written `async`.
