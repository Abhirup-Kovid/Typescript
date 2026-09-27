# Type system cheatsheet

Everything in `src/types/`, compressed to the parts worth recalling. Each line
links to the file it came from.

## The three spellings of a shape

| | declaration merging | unions / conditionals | error message |
|---|---|---|---|
| `interface` | yes | no | prints the name |
| `type` | no | yes | expands in full |

Default: `interface` for a thing, `type` for a relationship between things.
`interface` is the lower-friction choice when undecided, because you can
convert to `type` later and not the reverse. → `01-type-vs-interface.ts`

## Operators

| operator | produces | note |
|---|---|---|
| `A & B` | intersection | narrower than either; a key in both keeps the narrower type |
| `A \| B` | union | `keyof` over it is the *intersection* of keys |
| `keyof T` | keys of `T` | includes optional keys; for `T[]` it is `number \| "length" \| ...` |
| `typeof x` | type of `x` | widens literals unless `as const` |
| `infer X` | a captured type | only in the true branch of a conditional |
| `satisfies T` | check without widening | the fix for losing literal precision |

## The four that generate the rest

```ts
type Partial<T>      = { [K in keyof T]?: T[K] }
type Required<T>     = { [K in keyof T]-?: T[K] }        // the -? is the whole thing
type Readonly<T>     = { readonly [K in keyof T]: T[K] } // shallow!
type Pick<T, K>      = { [P in K]: T[P] }
type Exclude<T, U>   = T extends U ? never : T            // distributes over T
type Extract<T, U>   = T extends U ? T : never
type NonNullable<T>  = T extends null | undefined ? never : T
type ReturnType<F>   = F extends (...args: any) => infer R ? R : any
type Parameters<F>   = F extends (...args: infer P) => any ? P : never
```

## The three rules that cause most confusion

**1. A conditional distributes over a union when the checked type is a naked
type parameter.**

```ts
type IsString<T> = T extends string ? true : false
type X = IsString<string | number>   // boolean, not false
type Y = [string|number] extends [string] ? true : false  // false
```

`[T] extends [U]` suppresses distribution. Use it whenever you need one yes/no
rather than a per-member answer.

**2. A mapped type is homomorphic only when it iterates a bare type parameter.**

```ts
type A<T> = { [K in keyof T]: T[K] }        // inherits ? and readonly, distributes
type B<T> = { [K in keyof Other<T>]: T[K] } // neither
```

Break homomorphicity and the modifiers are applied flatly, so information
disappears quietly.

**3. `keyof` over a union is the intersection of the keys.**

```ts
keyof ({ a: 1 } | { b: 2 })   // never
```

Distributive fix: `T extends T ? keyof T : never`.

## Building blocks for the rest

```ts
// filter union members
type Members<T, U> = T extends U ? T : never

// a type predicate, when the compiler cannot see the relationship
function isString(v: unknown): v is string

// an assertion function, so `if (assert(x))` narrows
function assertIsDefined<T>(x: T): asserts x is NonNullable<T>

// exhaustive switch
default: { const unreachable: never = value; return unreachable }
```

## Limits worth remembering

- Types are erased. No runtime cost, and no runtime check.
- An index signature forces every named property to be assignable to it
  (TS2411).
- `Record<K, V>` over a union is a *total map*; `Record<string, V>` is an
  *index signature*. Reads from the latter are `V | undefined`.
- `Readonly<T>` is shallow. `ro.list.push(x)` still compiles.
- Recursive types hit TS2589 at 50 levels, and there is a separate total
  instantiation ceiling.
- `infer` does not capture what the pattern does not constrain; `infer X
  extends C` (4.8) exists because a bare `infer` in a constrained position
  resolves to the constraint.
- `as const satisfies T` checks *and* preserves. An annotation checks and
  widens.
- `Promise<T>` is invariant. `Promise<Sub>` is not assignable to
  `Promise<Super>`.

## Which tool, quickly

| situation | use |
|---|---|
| known keys, own types | mapped type |
| accept arbitrary keys of one type | index signature / `Record<string, V>` |
| one of several shapes | discriminated union, not optional fields |
| narrow a value | a type predicate, not `as` |
| "this cannot happen" | `never` |
| a value from outside | `unknown`, then narrow |
| three levels of `as` | change the model |
