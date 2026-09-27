// `&` builds an intersection: a value that satisfies *every* operand. The
// name is misleading if you think of it as a "join" - the result is narrower
// than any input, not wider.

type HasId = { id: string }
type HasName = { name: string }

type User = HasId & HasName

const u: User = { id: "1", name: "ravi" }
// const bad: User = { id: "1" }   ->  TS2739/2741, missing `name`

// A key present in both operands keeps the *narrower* type, not the first one.
type A = { value: string | number }
type B = { value: string }
type AB = A & B
// AB["value"] is `string` - the intersection of `string | number` and `string`.
// That is the rule: intersect member-wise, narrowest wins.

// ---------------------------------------------------------------------------
// What intersections are actually for
// ---------------------------------------------------------------------------
// 1. Composing a small reusable base with a specific shape.
type Timestamped = { createdAt: number; updatedAt: number }
type SoftDelete = { deletedAt: number | null }
type Row = { id: string } & Timestamped & SoftDelete

// 2. Adding a marker to a union member. Note that `A & B` where A is a *union*
//    distributes into a union of intersections, so the result is only
//    inhabitable if the object side can satisfy one of the literal arms.
type Tagged = ("idle" | "busy") & { tag: "important" }
// Tagged = ("idle" & { tag: "important" }) | ("busy" & { tag: "important" })
//
// so a bare `{ tag: "important" }` is NOT assignable to it:
//
//   TS2322: Type '{ tag: "important"; }' is not assignable to type 'Tagged'.
//     Type '{ tag: "important"; }' is not assignable to type
//     '"idle" & { tag: "important"; }'.
//
// Which is correct - a "busy" order is not an "idle" order just because both
// were tagged. To tag a union you want the object form, which is the next
// section.
type TaggedObj =
  | { state: "idle"; tag: "important" }
  | { state: "busy"; tag: "important" }
const taggedObj: TaggedObj = { state: "busy", tag: "important" }

// 3. Mixing a class instance type with extra members. This is where
//    intersections genuinely shine, because the class keeps its methods.
class Repo {
  find(id: string): unknown {
    return id
  }
}
type RepoWithCache = Repo & { cache: Map<string, unknown> }

declare const r: RepoWithCache
r.find("1")     // from the class
r.cache.size    // from the intersection
// r.count()    // TS2339, not on either side

// ---------------------------------------------------------------------------
// Discriminated unions beat intersections for "one of these"
// ---------------------------------------------------------------------------
// This is the mistake the operator invites. A flat intersection of variants
// says "a value has all of these at once":
type Bad = { kind: "circle"; radius: number } & { kind: "rect"; width: number }
// Bad["kind"] is `never`, because "circle" & "rect" has no values. So you have
// written a type that cannot be constructed - the compiler will tell you on
// any attempt to build one, and the error is baffling if you did not expect
// it.
//
// The correct tool for "one of these" is a union of object types with a
// shared literal discriminant. See narrowing/05.

// ---------------------------------------------------------------------------
// Intersection with a primitive, and the results nobody expects
// ---------------------------------------------------------------------------
type Str = string & { __brand: "Str" }   // branded type, see below
type Num = number & { __brand: "Num" }

declare const s: Str
declare const n: Num

// Both are "uninhabited" in practice: no ordinary string has the brand.
// So you can only produce them by casting, and that is the entire point.
// This is branded-type / nominal-typing emulation: it gives primitives a
// nominal identity that TypeScript's structural model cannot otherwise
// express.
//
//   function asStr(v: string): Str { return v as Str }
//   asStr("a") + asStr("b")   // TS2365: Operator '+' cannot be applied to
//                              // 'Str' and 'Str' - because Str does not
//                              // extend string... actually it does, since Str
//                              // is a subtype. The real use is preventing
//                              // a userId being passed where an orderId is
//                              // expected, which a plain `string` cannot do.

// ---------------------------------------------------------------------------
// Union versus intersection, in one line
// ---------------------------------------------------------------------------
//   A | B   "either A or B"    - more values, harder to use
//   A & B   "both A and B"      - fewer values, easier to use
//
// Unions make types *harder* to work with (you must narrow) and are the right
// tool for modelling alternatives. Intersections make types *easier* to work
// with and are the right tool for composing capabilities. If you find
// yourself fighting a union, the answer is usually to narrow, not to
// intersect. If you find yourself intersecting to escape a union, you have
// probably changed the model instead of the code.

type Status = "idle" | "busy"
const s2: Status = "idle"
const tagged: Status = "busy"

console.log(u, r.find("1"), r.cache.size, s, n, s2, tagged, taggedObj)
export type { HasId, HasName, User, A, B, AB, Timestamped, SoftDelete, Row, TaggedObj, RepoWithCache, Str, Num, Status, Bad }
