# Mental model: what the compiler is actually doing

Everything else in this repo follows from these five ideas.

## 1. Types are erased

There is no runtime representation of a type. `interface Order { id: string }`
and `type Order = { id: string }` both produce exactly zero bytes of output.
`as`, `<T>`, `satisfies` and every generic are compile-time only and vanish.

Consequence: a type can never *check* anything at runtime. A type predicate is
a promise, not a verification. `JSON.parse(x) as Order` does not validate `x`.

## 2. Every type is a set of values

`string` is "all strings". `"masala"` is "just that one string". The second is
a **subtype** of the first, and subtyping is one-directional:

```ts
let a: string = "masala"   // ok: the narrow value fits the wide type
let b: "masala" = a       // error: `string` might be "ginger"
```

A type is fully described by the set of values it permits. This is why
`3` is assignable to `number`, and why `true` is assignable to `boolean`.

## 3. Assignment is "does the right-hand set fit inside the left-hand set"

Assignability = is every value of the source type also a value of the target
type. That single rule explains almost every error message you will read,
including the surprising ones.

## 4. The compiler tracks values, not variables

After a check, the *narrowed* type applies to the value on that control-flow
path, not to the variable forever.

```ts
let size: "small" | "large" = "small"
if (size === "small") {
  // size is "small" here
}
// size is "small" | "large" again out here
```

This is why narrowing does not survive being stored in an object, passed to a
function, or read from a `let` that might have been reassigned.

## 5. `unknown` before `any`

`unknown` is the honest type for "I do not know yet". `any` is a licence to
skip checking. Prefer `unknown` and narrow; reach for `any` only when you
genuinely cannot express the constraint.

## Vocabulary

| term | meaning |
| --- | --- |
| assignable to | every value of A is also a value of B |
| subtype | A is assignable to B |
| narrower | describes fewer values |
| widening | a literal type widening to its base primitive (`"a"` -> `string`) |
| narrowing | recovering a narrower type from a wider one via a check |
| structural | compatibility is by shape, not by name |
| excess property check | extra properties rejected only on fresh object literals |
