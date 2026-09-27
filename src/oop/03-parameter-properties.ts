// Parameter properties: declare and assign a field in one line.

class Order {
  // Declared and initialised, and no assignment in the constructor:
  //   constructor(public readonly id: string, public cups: number) {}
  constructor(
    public readonly id: string,
    public cups: number,
    private placedAt: Date = new Date(),
    public notes?: string,
  ) {}

  ageInMs(): number {
    return Date.now() - this.placedAt.getTime()
  }
}

const order = new Order("o-1", 2)
console.log(order.id, order.cups, order.notes, order.ageInMs())

// ---------------------------------------------------------------------------
// What it emits
// ---------------------------------------------------------------------------
// `constructor(public cups: number) {}` is exactly this at runtime:
//
//   class Order {
//     cups;
//     constructor(cups) { this.cups = cups }
//   }
//
// It is a declaration shorthand, not a different mechanism. The field is
// still an own property on the instance, and it is still assigned in the
// constructor body - just written for you.
//
// Which brings us to the one thing that actually bites.

// ---------------------------------------------------------------------------
// The useDefineForClassFields problem
// ---------------------------------------------------------------------------
// This project sets `target: esnext`, which makes `useDefineForClassFields`
// default to `true`. That flag changes field initialisation from
// `this.x = value` to `Object.defineProperty(this, "x", { value })`.
//
// The consequence, and it is a real one: a field *declaration with no
// initialiser* still emits a definition that writes `undefined`. And it
// happens after `super()` returns. So a derived class that re-declares a base
// class's property - even just to add a type annotation - will overwrite
// whatever the base constructor set.
class Base {
  // Assigned in the constructor, below.
  label: string

  constructor() {
    this.label = "from-base"
    this.describe()
  }

  describe(): void {
    console.log("base sees:", this.label)
  }
}

class Derived extends Base {
  // The mistake. This is not a type-only annotation; it emits
  //   Object.defineProperty(this, "label", { value: undefined })
  // after super(), so the base's "from-base" is gone.
  label: string

  constructor() {
    super()
    this.label = "from-derived"
  }
}

console.log(new Derived().label)

// What the base constructor logged is the important bit, and the fix is
// either of:
//
//   1. `declare label: string` - type-only, emits nothing. The field belongs
//      to the base class; the derived class is only restating its type.
//   2. Do not restate it. The inherited type is already correct.
//
// `declare` is the tool for exactly this and for dependency injection, and it
// is the modifier people do not know about. It is not the same as `!`:
// `declare` emits nothing, `!` emits a definition that writes undefined.

// ---------------------------------------------------------------------------
// Parameter properties and readonly interact sensibly
// ---------------------------------------------------------------------------
class Point {
  // A readonly parameter property cannot be reassigned from outside *or*
  // inside the class body, which is the point of it.
  constructor(public readonly x: number, public readonly y: number) {}

  translate(dx: number, dy: number): Point {
    // this.x = ...   ->  TS2540. Even inside the class.
    return new Point(this.x + dx, this.y + dy)
  }
}

console.log(new Point(0, 0).translate(1, 2))

// ---------------------------------------------------------------------------
// What you cannot put in a parameter property
// ---------------------------------------------------------------------------
// - `declare` (no such thing - a parameter property is a real field)
// - a `this` parameter
// - an overload, a decorator with an incompatible signature, or anything that
//   needs a computed initializer
// - `public` on a parameter of an abstract method's implementation is fine,
//   but a parameter property on an abstract method signature is an error:
//     TS1071 and friends - a parameter property needs a body to assign to.
//
// Which is really the rule: a parameter property is a declaration plus an
// assignment, and an abstract method has no body to assign in.

console.log(order)
export { Order, Base, Derived, Point }
