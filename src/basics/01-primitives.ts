// The primitives, and the wrapper-object trap you will hit once.

const shopName: string = "Chai aur Code"
const cupsSold: number = 42
const isOpen: boolean = true

// `string` (lowercase) is the primitive type. `String` (capital) is the
// wrapper *object* from lib.es5.d.ts. Both accept "chai", and both would
// compile here:
//
//   let ok: string = "chai"   // what you want
//   let bad: String = "chai"  // compiles; `.length` is `number | undefined`
//                              // because String is an object with an index
//                              // signature, so it admits a missing key
//
// The rule: never use the capitalised version as a type annotation.

// number is an IEEE-754 double, identical to JavaScript's. Only integers
// between -(2^53 - 1) and 2^53 - 1 are exact. Past that, `0.1 + 0.2` style
// drift is not a TypeScript bug, it is the number type itself.
const taxRate: number = 0.05

// bigint exists for integers beyond Number.MAX_SAFE_INTEGER. It is a
// genuinely separate type: mixing it with number in arithmetic is an error,
// which is the compiler stopping you from silently losing precision.
const ledgerEntry: bigint = 9007199254740993n

// 1 + 1n  ->  TS2365: Operator '+' cannot be applied to types 'number' and 'bigint'

// symbol and unique symbol. `symbol` is the broad type; `unique symbol` is a
// *value that is its own type*, which is what makes it usable as a key in a
// type. Without `unique`, `Symbol("x")` and `Symbol("y")` would both just be
// `symbol` and would not be distinguishable.
const ORDER_PLACED: unique symbol = Symbol("order-placed")

// void is not "undefined". It is "the return value is not usable". A function
// that returns nothing is `void`; a function that returns a value you are
// required to ignore is different from one that returns nothing at all.
function logOrder(id: number): void {
  console.log(id, shopName, cupsSold, isOpen, taxRate, ledgerEntry, ORDER_PLACED)
}

logOrder(1)
