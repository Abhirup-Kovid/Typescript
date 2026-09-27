// Inference is not a guess. It is a fixed algorithm reading the initializer,
// and every widening decision below is spec behaviour, not heuristics.

const literalConst = "chai"     // type: "chai"    (const does not widen)
let literalLet = "chai"        // type: string    (let widens to the base)

const objectConst = { retries: 3, name: "brew" }
// type: { retries: number; name: string }
// Note: the *object* is not a literal type, but its properties are mutable,
// so each property widens from 3 -> number and "brew" -> string.

const objectFrozen = { retries: 3, name: "brew" } as const
// type: { readonly retries: 3; readonly name: "brew" }
// `as const` is recursive and applies readonly at every level. It is how
// you tell the compiler "treat this literal exactly as written".

// A function with no return annotation infers the union of what its body
// actually returns, with literal types preserved.
function statusOf(count: number) {
  if (count > 0) return "ok"
  if (count < 0) return "error"
  return "idle"
}
// statusOf(1) has type "ok" | "error" | "idle"

// ---------------------------------------------------------------------------
// The reveal trick
// ---------------------------------------------------------------------------
// When you genuinely cannot remember what was inferred, force the compiler to
// print it. Assign to a type that can never work and read the error:
//
//   const reveal: null = statusOf(1)
//   -> error TS2322: Type '"error" | "idle" | "ok"' is not assignable to type 'null'.
//
//// Or just hover the identifier in the editor. The reveal trick works in CI,
// in a code review comment, and in a plain terminal where hovering is not an
// option.

// ---------------------------------------------------------------------------
// When to annotate even though inference would work
// ---------------------------------------------------------------------------

// 1. Empty collections have nothing to infer from.
const orders: string[] = []
const menu: Record<string, number> = {}

// 2. `[]` alone would infer `never[]` / `any[]`. Worse, once an `any[]` exists
//    every later push is unchecked.
//    const bad: any[] = []

// 3. Function parameters are always `any` without an annotation. A parameter
//    can never be inferred from the call site - that would require inferring
//    the whole call graph.

// 4. Recursive data needs the annotation to break the circularity.
type OrderNode = { value: string; children: OrderNode[] }
const tree: OrderNode = { value: "root", children: [] }

// 5. Public API. An exported function's return type becomes a contract other
//    files depend on. If it is inferred from a body that later changes, every
//    consumer changes with it, with no error to point at the cause.
//
// 6. To widen deliberately. `let x: unknown = 1` forces you to narrow later
//    instead of trusting what the initializer happened to be.

export { statusOf, tree, orders, menu, objectConst, objectFrozen, literalConst, literalLet }
