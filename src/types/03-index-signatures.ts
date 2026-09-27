// An index signature declares what arbitrary string keys are allowed to hold.

type Inventory = {
  [sku: string]: number
}

const stock: Inventory = { chai: 10, coffee: 4 }
const chaiStock = stock["chai"]   // number | undefined, under
                                  // noUncheckedIndexedAccess. Without it, plain
                                  // `number`, which is a lie for a miss.

// ---------------------------------------------------------------------------
// The constraint nobody expects
// ---------------------------------------------------------------------------
// Every *named* property in the type must be assignable to the index
// signature's value type. This is the rule that produces the most confusing
// error in the language.
type Registry = {
  [key: string]: string
  // version: number    TS2411: Property 'version' of type 'number' is not
  //                    assignable to 'string' index type 'string'.
}

// const bad: Registry = { version: 1 }
//   TS2322: Type '{ version: number; }' is not assignable to type 'Registry'.
//     Property 'version' is incompatible with index signature.
//       Type 'number' is not assignable to type 'string'.
//
// Note the second message is much less obvious than the first. The
// declaration-site error names the property; the assignment-site error talks
// about an "index signature" you may not have realised you wrote.

// The fix is to make the declared type include the odd one out, or to use a
// union index type:
type Mixed = {
  [key: string]: string | number
  version: number
  name: string
}
const ok: Mixed = { version: 1, name: "x" }
// Every value on `ok` is `string | number | undefined`, including the index
// lookup, because noUncheckedIndexedAccess adds undefined for a possibly
// absent key. That is the honest type: `ok["anything"]` really can be
// undefined, and it really can be a number.
const mixedValue: string | number | undefined = ok["anything"]

// A symbol index signature is separate and has no such interaction with
// named properties:
type WithSymbols = {
  [key: symbol]: string
  normal: string
}
const withSym: WithSymbols = { normal: "x", [Symbol("k")]: "v" }

// ---------------------------------------------------------------------------
// Number index signatures
// ---------------------------------------------------------------------------
// An array is really `Array<T>` which is `{ [n: number]: T; length: number; ... }`.
type Ages = { [age: number]: string }
const ages: Ages = { 21: "ravi", 30: "abhi" }
const first: string | undefined = ages[21]

// A string index signature satisfies a number one for object literals? No -
// they are separate. `Record<string, T>` does not accept `Record<number, T>`
// the way you might expect; number keys are just strings at runtime but the
// types are distinct.
//   const r: Record<string, number> = { 1: 2 }   // ok, numeric literals
//                                                   // become string keys
//   const r2: Record<number, number> = { a: 1 }   // TS2353

// ---------------------------------------------------------------------------
// keyof, and the array surprise
// ---------------------------------------------------------------------------
type Keys = keyof Inventory   // string | number
// `keyof` on a type with a string index signature includes `number`, because
// numeric indices are a subset of string keys at runtime. This is the first
// thing that surprises people using keyof with index signatures.

const list = ["a", "b"]
type ListKeys = keyof string[]
// ListKeys is NOT "0" | "1" | "length". It is:
//   number | "length" | "toString" | "at" | "pop" | ... every Array method.
// `keyof` on an array gives you the *interface*, not the indices.
//
// If you want indices, you need a tuple (`as const`) or `number`. This is why
// `keyof T[]` is almost never what you wanted.

// ---------------------------------------------------------------------------
// Index signatures versus mapped types
// ---------------------------------------------------------------------------
// A mapped type `{ [K in keyof T]: T[K] }` produces a type with *known* keys,
// each with its own type. An index signature produces a type with an unknown
// set of keys that all share one type.
//
// That difference is the whole point:
//   Mapped type  -> obj.key    is `number`, obj.other is not allowed
//   Index sig    -> obj.anything is `number | undefined`
//
// So a mapped type is for a shape you know; an index signature is for a shape
// you accept. Record<K, V> is the utility version of an index signature,
// which is why it is the right tool for dictionaries and the wrong tool for
// configuration objects.

// ---------------------------------------------------------------------------
// Pick what you accept, narrow what you trust
// ---------------------------------------------------------------------------
// The practical pattern: parse `unknown` into a known type, then hand out a
// type with guaranteed keys. The index signature is the *input* contract; the
// interface is the *output* contract.
function getSetting<T extends Record<string, unknown>>(settings: T, key: keyof T): T[keyof T] | undefined {
  return settings[key]
}

const settings = { retries: 3, timeoutMs: 1000, verbose: true }
const r1 = getSetting(settings, "retries")    // number | boolean | undefined
console.log(chaiStock, ok, mixedValue, withSym, first, getSetting(settings, "verbose"), r1)
export type { Inventory, Registry, Mixed, WithSymbols, Ages, Keys, ListKeys }
