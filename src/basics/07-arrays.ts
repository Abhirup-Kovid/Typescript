// Two spellings, one type. `T[]` and `Array<T>` are identical to the
// compiler; pick by readability, and prefer `T[]` except when the element type
// is itself generic or a union you want visually grouped.

const orders: string[] = []
const prices: Array<number> = []
const mixed: (string | number)[] = ["a", 1]
// Without the parens: (string | number)[] vs string | number[]
//   string | number[]   // is `string | (number[])` -- an array of numbers,
//                       // or a plain string. Almost never what you meant.

// Readonly variants. Neither stops a runtime mutation; both stop the
// compiler from allowing one. `readonly T[]` is preferred over
// `ReadonlyArray<T>` because it does not collide visually with tuple syntax.
const immutable: readonly string[] = ["masala", "ginger"]
const alsoImmutable: ReadonlyArray<string> = ["masala", "ginger"]
// immutable.push("elaichi")  ->  TS2339: Property 'push' does not exist.

// ---------------------------------------------------------------------------
// Indexing, and why this project has noUncheckedIndexedAccess on
// ---------------------------------------------------------------------------
const first = orders[0]
// With the default compiler options `first` is `string`, which is a lie: an
// array can be empty, and `orders[99]` is `undefined` at runtime.
//
// This repo sets `noUncheckedIndexedAccess: true`, which makes `first` a
// `string | undefined`. The compiler is now telling the truth at the cost of
// one `!` or one check per access. It is the single most valuable strict flag
// in a codebase that touches arrays.

const definitely: string | undefined = first

// `.at()` is always `T | undefined`, with or without the flag, because it is
// explicitly documented to return undefined for out-of-range indices.
const maybeFirst: string | undefined = orders.at(0)

// `for...of` and array methods are unaffected by the flag -- the callback
// parameter is typed from the element type, not from an index.
for (const order of orders) {
  console.log(order.toUpperCase())
}

orders.forEach((order, index) => {
  console.log(order, index)
})

// Destructuring an index is *also* affected by the flag, which surprises
// people: `head` is `string | undefined`, not `string`. TS treats `[0]` on an
// array as an index access, and a bare index access can miss.
const [head, ...tail] = orders
// const headIsString: string = head   // TS2322: string | undefined
// `tail` is `string[]` - the rest element is genuinely a fresh array, so it
// is never undefined.

const [knownFirst = "fallback"] = orders
// The default only applies when the value is `undefined`, and it satisfies
// the compiler, so `knownFirst` is `string`.

// ---------------------------------------------------------------------------
// Arrays are covariant, which is unsound and TypeScript allows it anyway
// ---------------------------------------------------------------------------
type Animal = { name: string; speak(): void }
type Dog = Animal & { bark(): void }

declare const goodDog: Dog
// Allowed: every Dog is an Animal.
// const animals: Animal[] = [goodDog]
// animals.push({ name: "cat", speak() {} })  // no compile error, and now
//                                             // goodDog is in an array that
//                                             // may contain a cat.
//
// This is the classic unsound spot in TypeScript's array type. It is
// deliberate: banning it would break a huge amount of idiomatic code.
// The practical habit that avoids the bug is to annotate variables as
// `readonly T[]` when you only read.

const t = [[1, 2], [3, 4]] as const
// `as const` on a nested array makes it a readonly *tuple* type, so the
// inner lengths are known: typeof t is readonly [readonly [1, 2], readonly [3, 4]]

export { orders, prices, mixed, immutable, alsoImmutable, definitely, maybeFirst, head, tail, t, first }
