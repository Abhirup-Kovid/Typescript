// The discriminated union: the default shape for "one of these things".
//
// Every variant shares one field with a literal type unique to that variant.
// That single field turns every check on it into a complete partition of the
// union, and makes `switch` exhaustiveness-checked.

type Circle = { kind: "circle"; radius: number }
type Rect = { kind: "rect"; width: number; height: number }
type Polygon = { kind: "polygon"; sides: number; label: string }

type Shape = Circle | Rect | Polygon

declare const shape: Shape

// area() has NO default case, NO return type annotation, and it still has no
// "not all code paths return a value" error. TypeScript can prove the switch
// is total, so the implicit `undefined` return path does not exist.
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2
    case "rect":
      return shape.width * shape.height
    case "polygon":
      // A regular polygon: n * s^2 / (4 * tan(pi/n))
      return (shape.sides * shape.label.length * shape.label.length) / (4 * Math.tan(Math.PI / shape.sides))
  }
}

// ---------------------------------------------------------------------------
// The payoff: adding a variant breaks every non-exhaustive switch
// ---------------------------------------------------------------------------
// Add `type Square = { kind: "square"; side: number }` to `Shape` and
// `area` above stops compiling with:
//
//   Function lacks ending return statement and return type does not include
//   'undefined'. TS2366
//
// That error appears in the commit that adds the variant, not three weeks
// later in production. This is the single strongest argument for modelling
// states as a discriminated union rather than as a bag of optional fields.

// ---------------------------------------------------------------------------
// The bag-of-optionals version, for contrast
// ---------------------------------------------------------------------------
// The same four shapes written the other way:
type ShapeBad =
  | { radius?: number; width?: number; height?: number; sides?: number; label?: string }

function areaBad(shape: ShapeBad): number {
  if (shape.radius !== undefined) return Math.PI * shape.radius ** 2
  if (shape.width !== undefined && shape.height !== undefined) return shape.width * shape.height
  return 0
}
// Problems, all of them real:
//  - `{ radius: 5, width: 3 }` is a *valid* ShapeBad. Nothing rejects it.
//  - `areaBad` returns 0 for a malformed shape, so a bug becomes a wrong
//    number instead of an error.
//  - `{ radius: 0 }` is legal and silently falls through to the last return.
//  - Adding a property to one variant touches unrelated code.
//
// The discriminated union makes the invalid states unrepresentable. That is
// the goal, and it is worth structural churn to get there.

// ---------------------------------------------------------------------------
// Narrowing works anywhere the discriminant is checked
// ---------------------------------------------------------------------------
const r = shape.kind === "rect" ? shape.width * shape.height : 0
// shape is narrowed inside the true arm of the conditional expression

if (shape.kind !== "circle") {
  // shape is Rect | Polygon here. `!==` narrows just as well as `===`.
  console.log(shape)
}

function kindOf(s: Shape): "circle" | "rect" | "polygon" {
  return s.kind
}

// ---------------------------------------------------------------------------
// A union of unions still discriminates
// ---------------------------------------------------------------------------
type Ingredient = { kind: "solid"; grams: number } | { kind: "liquid"; ml: number }
type Order = { id: string; items: Ingredient[] }

declare const order: Order
for (const item of order.items) {
  if (item.kind === "solid") {
    console.log(item.grams)  // number
  } else {
    console.log(item.ml)     // number
  }
}

console.log(area(shape), areaBad({}), kindOf(shape), r)
export type { Circle, Rect, Polygon, Shape, ShapeBad, Ingredient, Order }
