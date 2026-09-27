# Narrowing

Narrowing is how a specific type is recovered from a wider one. It emits no
runtime code (the checks are already in your source); it is purely the
compiler deciding what it knows at a given point.

## Why it exists

Without it, every property access on a union would need a runtime check by
hand, and the compiler could never help. With it, the check you already wrote
is enough, and the types after the check get precise for free.

```ts
function print(value: string | number) {
  if (typeof value === "string") {
    value.toUpperCase()   // value is string here
  } else {
    value.toFixed(2)      // value is number here
  }
}
```

## The complete list of ways to narrow

| technique | works on | notes |
| --- | --- | --- |
| `typeof x === "..."` | primitives, `unknown`, `object`, `Function` | returns a *type* too, usable in signatures |
| truthiness `if (x)` | anything nullable/falsy in the union | removes `""`, `0`, `false` too, not just nullish |
| `x !== null` / `x != null` | any nullable union | `!= null` (loose) removes both `null` and `undefined` in one check |
| `x instanceof C` | class types, and built-ins that are classes | fails for interfaces, arrow functions, cross-realm values |
| `"k" in x` | unions of object types | narrows to the arms that declare `k`; needs an object on the right |
| `Array.isArray(x)` | `any[]`/readonly arrays | a real runtime narrowing for the array case `typeof` cannot do |
| discriminant check | unions sharing a literal-typed field | the highest-value form; see below |
| `x is T` predicate | anything, given a boolean-returning function | unchecked promise |
| `asserts x is T` | anything, given an assertion function | same, plus it narrows on the *success* path |
| `switch` on a literal | discriminated unions | all cases at once |
| `satisfies` / generics | — | not narrowing; constraint satisfaction instead |

## The rules that trip people up

1. **Narrowing applies to a value, on a path, not to a variable forever.**
   ```ts
   let s: "a" | "b" = "a"
   if (s === "a") { /* s is "a" */ }
   /* s is "a" | "b" again */
   ```

2. **Assigning inside a branch invalidates a narrowing.** The compiler
   assumes a `let` may be reassigned by anything, so
   ```ts
   let s: string | number = readIt()
   if (typeof s === "string") {
     s = computeNumber()   // legal, and it widens s back inside the block
     s.toFixed()           // error again
   }
   ```
   Use `const` where you can. Half of "narrowing randomly stops working" is
   this.

3. **Narrowing does not survive storage.** Once the value is inside an object
   or an array, the compiler stops tracking it, because something else could
   have written to it. Capture it in a `const` first.

4. **`typeof null === "object"`.** A `typeof` guard that checks for `"object"`
   does not exclude `null`. You still need `x !== null`, or `x != null`.

5. **A type predicate is a promise, not a proof.** If the predicate lies, the
   compiler believes it and the bug surfaces far from its cause.

6. **Assertions only apply where the compiler can see the function.** The call
   target must have an explicit type annotation:
   ```ts
   const isString: (x: unknown) => x is string = (x): x is string => typeof x === "string"
   // ^ the explicit annotation on `isString` is required; without it TS2775
   ```
   This is why `const assertX = (x: unknown): asserts x is T => {...}` often
   fails to narrow at the call site, while
   `function assertX(x: unknown): asserts x is T {...}` just works.

## Discriminated unions

Give every variant of a union one field with a literal type that is unique to
that variant. The compiler then treats a check on that field as a complete
partition, and `switch` becomes exhaustive-checked for free.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number }
```

This is the pattern to reach for by default when modelling "one of these
things". It moves the exhaustiveness guarantee from your memory to the
compiler.
