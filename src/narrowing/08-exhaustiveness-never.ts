// Exhaustiveness: turning "I forgot a case" from a runtime bug into a
// compile error.

type Circle = { kind: "circle"; radius: number }
type Square = { kind: "square"; side: number }
type Rect = { kind: "rect"; w: number; h: number }

type Shape = Circle | Square | Rect

// The one helper you will use more than any other in this file.
function assertNever(value: never, message = "unhandled"): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`)
}

// ---------------------------------------------------------------------------
// The two ways to write a total function, and what each one costs
// ---------------------------------------------------------------------------

// 1. No default case, no return annotation. The compiler proves totality from
//    the switch itself. A `default` here would *destroy* that proof, so there
//    must not be one.
function describeNoDefault(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `circle r=${shape.radius}`
    case "square":
      return `square s=${shape.side}`
    case "rect":
      return `rect ${shape.w}x${shape.h}`
  }
}

// 2. Explicit `never` check in the default. The other idiom, and the one that
//    survives a `default` clause you needed for other reasons. `shape` in the
//    default arm is `never` only because every other arm returned; assign it
//    to a `never` variable and the proof becomes visible rather than implicit.
function describeWithNever(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `circle r=${shape.radius}`
    case "square":
      return `square s=${shape.side}`
    case "rect":
      return `rect ${shape.w}x${shape.h}`
    default: {
      const exhaustive: never = shape
      return assertNever(exhaustive)
    }
  }
}

// Both break on:
//
//   type Shape = Circle | Square | Rect | Triangle
//
// 1. TS2366: Function lacks ending return statement and return type does not
//    include 'undefined'. TS2366
// 2. TS2322: Type 'Triangle' is not assignable to type 'never'. TS2322
//
// The second message names the exact variant you forgot, which is why the
// `never` form is often preferred despite being noisier.

// ---------------------------------------------------------------------------
// Exhaustive if/else chains
// ---------------------------------------------------------------------------
// Works the same way. Note that `never` only appears once *every* arm is
// handled - leave one out and the residual type is that one arm, not `never`.
// Getting this wrong is the most common way to think you have an
// exhaustiveness check when you do not.
function radiusOf(shape: Shape): number {
  if (shape.kind === "circle") return shape.radius
  if (shape.kind === "square") return shape.side
  if (shape.kind === "rect") return Math.max(shape.w, shape.h)
  // Only now is `shape` a `never`.
  const unhandled: never = shape
  return assertNever(unhandled)
}

// ---------------------------------------------------------------------------
// Applying it to a union of result states
// ---------------------------------------------------------------------------
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

// A `Result` cannot be narrowed to `never` with an if - the failure arm is a
// real case you have to do something with, not a "should be impossible"
// case. The idiomatic split is to throw, which is a return-on-that-path:
//   if (result.ok) return result.value
//   throw new Error(result.error)
//
// The `never` assertion only earns its place when the residual really is
// impossible. Note that the `Result<T>` type below is a *generic* union, and
// the exhaustiveness check works identically inside a generic function -
// `T` is treated opaquely.
function unwrapOr<T>(result: Result<T>, fallback: T): T {
  if (result.ok) return result.value
  return fallback
}

const good: Result<number> = { ok: true, value: 1 }
const bad: Result<number> = { ok: false, error: "nope" }

// A genuine `never` case: once `ok` is false, the *rest* of the value is
// fully described by `error`, so there is nothing left to handle.
function requireOk<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(result.error)
  }
  return result.value
}

// ---------------------------------------------------------------------------
// Exhaustiveness in reverse: a lookup that must be total
// ---------------------------------------------------------------------------
// A `Record<K, V>` where K is a union is a total map by construction, and a
// lookup over it is exhaustively typed without any switch at all.
type Status = "queued" | "brewing" | "served" | "cancelled"

const NEXT: Record<Status, Status> = {
  queued: "brewing",
  brewing: "served",
  served: "queued",
  cancelled: "cancelled",
}

function next(status: Status): Status {
  return NEXT[status]
}

// Adding "refunded" to `Status` makes the object literal above a compile
// error (TS2741) *and* makes `NEXT[status]` keep its return type. The map
// cannot fall through to undefined because it cannot be missing a key.

// The `satisfies` variant, when you want inference *and* totality:
// const NEXT = { ... } satisfies Record<Status, Status>

console.log(describeNoDefault({ kind: "circle", radius: 1 }), describeWithNever({ kind: "square", side: 2 }), radiusOf({ kind: "rect", w: 1, h: 2 }), unwrapOr(good, 0), unwrapOr(bad, 0), requireOk(good), next("queued"))
export { assertNever, describeNoDefault, describeWithNever, radiusOf, unwrapOr, requireOk, next, NEXT }
export type { Shape, Circle, Square, Rect, Result, Status }
