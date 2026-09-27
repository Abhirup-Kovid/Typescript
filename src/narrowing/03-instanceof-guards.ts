// `instanceof` narrows class types, and unlike `typeof` it can do it for
// objects with real prototypes.

class Cart {
  items: string[] = []
  add(item: string): this {
    this.items.push(item)
    return this
  }
}

class SavedCart extends Cart {
  label: string
  constructor(label: string) {
    super()
    this.label = label
  }
}

declare const cart: Cart | SavedCart

// narrows to SavedCart in the true arm, Cart in the false arm
function describeCart(cart: Cart | SavedCart): string {
  if (cart instanceof SavedCart) {
    return `saved: ${cart.label} (${cart.items.length})`
  }
  return `cart: ${cart.items.length}`
}

console.log(describeCart(cart))

// ---------------------------------------------------------------------------
// It works for the built-in classes too
// ---------------------------------------------------------------------------
declare const value: string | number | Date | RegExp | Error | Map<string, number> | null

function inspect(value: string | number | Date | RegExp | Error | Map<string, number> | null): string {
  if (value instanceof Date) {
    return value.toISOString()   // narrowed to Date
  }
  if (value instanceof RegExp) {
    return value.source          // narrowed to RegExp
  }
  if (value instanceof Error) {
    return value.message         // narrowed to Error
  }
  if (value instanceof Map) {
    return `map of ${value.size}` // narrowed to Map<string, number>
  }
  if (value === null) {
    return "null"
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// The three things instanceof cannot do
// ---------------------------------------------------------------------------
// 1. It cannot narrow an interface. Interfaces have no runtime identity:
//      interface Bird { fly(): void }
//      bird instanceof Bird   ->  TS2358: 'Bird' only refers to a type.
//    Structural types have nothing to test against at runtime. This is the
//    single most common instanceof mistake - a type predicate is the fix.
//
// 2. It cannot see plain object literals. `{ name: "x" }` has Object.prototype,
//    so `x instanceof SomeClass` is false at runtime even when the shape
//    matches. This bites on JSON.parse output every single time.
//
// 3. It breaks across realms. A Date created in an iframe, a worker, or a VM
//    has a different Date constructor, so `x instanceof Date` is false while
//    `Object.prototype.toString.call(x) === "[object Date]"` is true.
//    `Array.isArray` is also cross-realm safe, which is why it is special.

interface Bird {
  fly(): void
}
const sparrow: Bird = { fly: () => undefined }
// sparrow instanceof Bird  ->  TS2358. No runtime value named Bird exists.

// ---------------------------------------------------------------------------
// Narrowing to a subclass works both directions
// ---------------------------------------------------------------------------
// The `true` arm of `instanceof` can be *more* specific than the declared
// type, which is what makes `add(): this` and fluent APIs typecheck.
declare const anyCart: Cart
const fluent = anyCart.add("masala")
fluent.add("ginger").add("elaichi")
// fluent is SavedCart | Cart, not just Cart - `this` preserves the subtype.

// ---------------------------------------------------------------------------
// instanceof on a generic
// ---------------------------------------------------------------------------
// The class on the right of instanceof is a *value*, so it cannot reference a
// type parameter. `x instanceof T` inside a generic function is an error even
// though it looks reasonable.
function firstOrNull<T>(items: T[]): T | null {
  return items.length > 0 ? (items[0] ?? null) : null
}

console.log(inspect(new Date(0)), inspect(/x/), inspect(new Error("e")), inspect(new Map()), sparrow, firstOrNull([1]))
export type { Bird }
