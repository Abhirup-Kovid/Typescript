# Functions and generics

## A function has three separate parts

```ts
function f(a: string, b: number): boolean { ... }
```

1. **Parameter list** — what callers may pass.
2. **Return type** — what callers may rely on.
3. **Runtime body** — erased entirely, except for the parameters it uses.

The first two are the contract; the third is an implementation detail. Almost
every function-typing decision is about drawing that line correctly.

## Inference rules worth memorising

- A function with **no** return annotation infers a union of the literal types
  its body returns, and *keeps* the literals. Three `return "a" | "b" | "c"`
  arms infer `"a" | "b" | "c"`, not `string`.
- A parameter with no annotation is implicitly `any` **only** when
  `noImplicitAny` is off. With `strict` on, it is an error. Parameters can
  never be inferred from call sites — that would require inference through
  the whole call graph.
- Contextual typing flows the other way: a function expression assigned to a
  contextually-typed location (an array of handlers, an object literal, a
  callback argument) gets its parameter types from that context, with no
  annotation.

## Optional, default, rest

| form | parameter type | when is it optional |
| --- | --- | --- |
| `a?: T` | `T \| undefined` | explicitly, caller may omit it |
| `a: T = x` | `T` (not `\| undefined`) | only if the initializer is `undefined` |
| `...rest: T[]` | `T[]` | caller may pass zero |

A parameter with a default is *not* `T | undefined` at the call site, and it
is not allowed to be followed by a required parameter. An optional parameter
is also not allowed before a required one (except after a rest element, and
in tuples where it is allowed if followed only by more optionals).

`arguments`-style `a: T | undefined` is different from `a?: T` only in that
it is not syntactically omissible — you must write `f(undefined)`.

## Overloads

An overload set is a list of public signatures plus one implementation
signature that is invisible to callers.

```ts
function f(a: string): string
function f(a: number): number
function f(a: string | number) { return a }   // not callable externally
```

- The implementation signature is not part of the public API. Calling `f` with
  a `string | number` is an error, even though the implementation accepts it.
- Every overload must be assignable to the implementation signature. The
  compiler checks this and reports it on the *implementation*.
- Only overloads with an identical parameter list can be merged into one
  function; otherwise they are duplicate identifiers.
- Optional parameters cannot be followed by overloads, and overload
  resolution picks the first match in declaration order.

## Generics

`function first<T>(items: T[]): T | undefined` — a type parameter is a
*placeholder* that the caller fills in. It is resolved at the call site, not
at the declaration, and the two are checked against each other.

Rules:

- Inference runs from the arguments. If nothing constrains `T`, and
  `noImplicitAny` is on, you get TS7006 ("implicitly has type 'any' because it
  does not have a type annotation and is referenced directly or indirectly in
  its own initializer"). `f<T>()` with no arguments is the common case.
- `T` without a constraint is implicitly `unknown` inside the body, not `any`.
  So `function f<T>(x: T) { x.anything }` is an error — you must narrow.
- `extends` on a type parameter is a constraint, and it makes the type
  parameter usable like that type inside the body.
- A constraint is a *minimum*, not a substitution. `T extends string` does not
  mean `T` is `string`; it means `T` is at least as narrow as `string`.
- Default type parameters (`<T extends object = Record<string, unknown>>`)
  make a parameter optional. Constraints come first, then defaults.
- Generic constraints are checked *eagerly* at the call site, not lazily —
  `f<number, string>(...)` errors immediately even if the body would have
  been fine.

## Variance

TypeScript is *unsound* about generic variance in argument position for the
most part: it is bivariant for method parameters, which is why
`Array<Dog>` is assignable to `Array<Animal>`. This is deliberate and it is
why the array covariance footgun exists at all.

The practical rule: do not rely on the type system to keep a mutable
collection homogeneous. Use `readonly T[]` at the boundary, and concrete types
on the inside.

## `this` parameter

```ts
function f(this: Foo, x: number): void
```

- It is erased, so it costs nothing at runtime.
- It must be the first parameter.
- Its only job is to make `this` typed inside the body, and to require callers
  to invoke it with a compatible receiver.
- Without it, `this` inside a function declaration is `any` under
  `noImplicitThis`, and silently wrong when the function is detached.
