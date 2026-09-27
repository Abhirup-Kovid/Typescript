// Enums, and why the community mostly stopped using them.

// ---------------------------------------------------------------------------
// What a TS enum actually compiles to
// ---------------------------------------------------------------------------
// Unlike every other type in the language, an enum emits runtime code - a
// frozen object plus, for numeric enums, a reverse mapping.

enum SizeCode {
  Small = 0,
  Medium = 1,
  Large = 2,
}

// `SizeCode.Small` is the number 0 at runtime, and the reverse map exists too:
//   (SizeCode as any)[0] === "Small"

// I wrote a comment here claiming a numeric enum is a union of numbers, so any
// number is assignable - `const notAMember: SizeCode = 7`. The compiler
// disagreed:
//
//   TS2322: Type '7' is not assignable to type 'SizeCode'.
//
// That was true up to TypeScript 4.9 and stopped being true in 5.0, where
// *every* enum member became a literal enum member. Before 5.0 an enum was a
// union of numbers, and therefore open: `7` was assignable, and the value
// could be a number that was not in the enum at all. Since 5.0 the type is the
// closed union of its members, so a numeric enum is now as closed as a string
// one. Worth knowing if you maintain code that relied on the old behaviour,
// because the fix is a cast at the deserialisation boundary - the same place
// you would have needed one anyway.

// `const enum` inlines values and emits no object, but it is incompatible with
// isolatedModules - this project enables that - and it cannot help when the
// enum has to exist at runtime anyway, to iterate, to send over the wire, or to
// store in a database. So it rarely buys anything.

// ---------------------------------------------------------------------------
// The alternative: a const object plus a derived union
// ---------------------------------------------------------------------------
const SIZES = {
  Small: "small",
  Medium: "medium",
  Large: "large",
} as const

type Size = (typeof SIZES)[keyof typeof SIZES]
// "small" | "medium" | "large"
//   as const     -> literal types, and readonly
//   keyof typeof -> the three keys
//   [key]        -> the union of the values
//
// Three pieces already learned. The result is a genuinely closed set:

const ok: Size = "medium"
// const bad: Size = "huge"     // TS2322. Unlike the enum, this is closed.

// The value side is also better for narrowing. An enum needs a runtime lookup
// to enumerate; a const object already has its keys:
const all: Size[] = Object.values(SIZES)   // ["small", "medium", "large"]

// And exhaustiveness works identically, which is the thing people actually
// use enums for:
function label(value: Size): string {
  switch (value) {
    case "small":
      return "S"
    case "medium":
      return "M"
    case "large":
      return "L"
    default: {
      const unreachable: never = value
      return unreachable
    }
  }
}

// A lookup that cannot fall through to `undefined`:
const SCALE: Record<Size, number> = { small: 1, medium: 2, large: 3 }
const scale = (value: Size): number => SCALE[value]

// ---------------------------------------------------------------------------
// So when is an enum still right?
// ---------------------------------------------------------------------------
// 1. Heterogeneous members, where the values are not a set you want to
//    enumerate: `enum Log { Info = "INFO", Error = "ERROR" }` is closer to a
//    namespace of constants than to a union of literals.
// 2. A numeric protocol - HTTP status codes - where the reverse mapping is
//    genuinely useful and the value space is not meant to be user-facing.
// 3. Declaration merging. `declare enum` in a .d.ts alongside a runtime object
//    in the .js is how some older libraries shipped types, and the const-object
//    pattern cannot do it.
//
// Otherwise: literal union plus a const object. A smaller runtime object, a
// closed type, free iteration, working exhaustiveness, and no reverse map to
// misread.

enum Log {
  Info = "INFO",
  Error = "ERROR",
}
const level: Log = Log.Error
const levelName: "INFO" | "ERROR" = Log.Error   // the value type is the union

console.log(SizeCode.Medium, SIZES, ok, all, label("large"), scale("medium"), level, levelName)
