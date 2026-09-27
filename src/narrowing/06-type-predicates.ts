// A type predicate is a function signature that claims "if this returns true,
// the value is now T". It is the escape hatch for narrowing that the built-in
// guards cannot express.

type Order = { id: string; cups: number }

// `obj is Order` is the predicate. The parameter must accept what you will
// pass in - usually `unknown` or a union - and the return type must be
// exactly `boolean` (or assignable to it).
function isOrder(value: unknown): value is Order {
  // The body is the only thing doing any real work. The compiler does not
  // check the body against the predicate; it trusts the return.
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    "cups" in value &&
    typeof (value as { cups: unknown }).cups === "number"
  )
}

// The whole point: without a predicate, this function would be
// `(value: unknown) => boolean`, and every call site would still have to
// narrow by hand. With it, the call site is narrowed.
declare const raw: unknown
if (isOrder(raw)) {
  raw.cups.toFixed(2)   // raw is Order here
}

// ---------------------------------------------------------------------------
// The promise is unchecked. This is the part to be careful about.
// ---------------------------------------------------------------------------
function isPositive(value: number): boolean {
  return true // a lie
}

function useIt(n: number): number {
  if (isPositive(n)) {
    return n * 2  // compiles. n is still number, so no visible damage here -
  }               // but any narrowing inside that block is now unsound.
  return 0
}

// A predicate that lies *and* changes the type is the dangerous version.
// Note what the compiler does: `n` is `number`, and the true arm claims
// `string`, so it narrows to `number & string`, which reduces to `never`.
function alwaysString(value: unknown): value is string {
  return true
}

function broken(n: number): number {
  if (alwaysString(n)) {
    // n is `never` here. TS2339: Property 'length' does not exist on type
    // 'never'.
    //
    // So a lying predicate does not silently produce wrong types - it produces
    // `never`, which is loudly broken in a different way. That is a much
    // better failure mode than I assumed when writing this: the compiler
    // refuses to invent an intersection of incompatible types. The realistic
    // danger is narrower - a predicate that is *mostly* right, or a predicate
    // over a union where the wrong arm keeps the right-looking shape.
    return 0
  }
  return n
}
console.log(useIt(2), broken(1))

// ---------------------------------------------------------------------------
// Predicates can be generic, which is what makes them genuinely powerful
// ---------------------------------------------------------------------------
// `item is T` where T is inferred from the array being searched. The result
// is `T[]` with the narrowing baked in, and no cast anywhere.
function filterBy<T, K extends keyof T>(
  items: T[],
  key: K,
  predicate: (value: T[K]) => boolean,
): T[] {
  return items.filter((item) => predicate(item[key]))
}

type Row = { id: string; name: string; deletedAt: number | null }

declare const rows: Row[]
const alive = filterBy(rows, "deletedAt", (v) => v === null)
// alive is Row[]. The predicate and the key stay type-safe together: pass the
// wrong key and the predicate parameter type changes to match, so the error
// is in the call, not deep inside `filterBy`.

// ---------------------------------------------------------------------------
// Predicates as method guards
// ---------------------------------------------------------------------------
class Queue {
  private items: string[] = []

  push(item: string): this {
    this.items.push(item)
    return this
  }

  // A method can be a predicate. The `this` return is the fluent touch.
  has(item: string): boolean {
    return this.items.includes(item)
  }
}

const q = new Queue().push("masala")
if (q.has("masala")) {
  console.log("queued")
}

// ---------------------------------------------------------------------------
// Restrictions worth knowing
// ---------------------------------------------------------------------------
// 1. The parameter cannot be optional or rest, and cannot be a destructured
//    pattern. `function isX({ a }: T): a is ...` is an error - the parameter
//    must be a plain identifier, because the predicate is about *that* value.
// 2. The function must return `boolean`, not `Boolean` and not a truthy union.
// 3. A predicate cannot be used to narrow a *property*, only a value you hold
//    in a variable or parameter. `if (isOrder(order.id))` will not narrow
//    `order.id`; capture it in a const first.

export { isOrder, filterBy, isPositive, alwaysString, q, Queue }
export type { Order, Row }
