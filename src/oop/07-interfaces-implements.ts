// `implements` is a compile-time assertion and nothing else. It emits no
// code, creates no prototype relationship, and is not inheritance.

interface Brewable {
  brew(): string
  readonly ready: boolean
}

// `implements` checks that the *instance* type satisfies the interface.
class Kettle implements Brewable {
  readonly ready = true
  brew(): string {
    return "brewing"
  }
}

class FrenchPress implements Brewable {
  private water = 0
  get ready(): boolean {
    return this.water > 0
  }
  brew(): string {
    this.water += 1
    return "plunging"
  }
}

const kettle: Brewable = new Kettle()
const press: Brewable = new FrenchPress()
console.log(kettle.brew(), press.brew(), press.ready)

// ---------------------------------------------------------------------------
// What `implements` does NOT give you
// ---------------------------------------------------------------------------
// 1. No prototype relationship. `kettle instanceof Brewable` is a compile
//    error - TS2359, because `Brewable` is a type, not a value, and there is
//    no runtime identifier to test against.
// 2. No inherited members. A class does not get anything from the interface;
//    it already has everything, and the keyword just checks it.
// 3. No nominal identity. Two unrelated classes that both `implements
//    Brewable` are not related to each other in any way.
// 4. No constraint on how the members are implemented. A getter satisfies a
//    property, a method satisfies a property, either direction.

// Kettle implements Brewable, and Kettle is NOT a subclass of anything.
// class Sub extends Kettle {}   //  Kettle's own shape, unrelated to Brewable

// ---------------------------------------------------------------------------
// extends + implements together, which is the useful combination
// ---------------------------------------------------------------------------
interface Loggable {
  log(message: string): void
}

abstract class Service implements Loggable {
  // Satisfies the interface, and is available to subclasses.
  log(message: string): void {
    console.log(`[${this.constructor.name}] ${message}`)
  }

  abstract run(): void
}

class OrderService extends Service {
  run(): void {
    this.log("running")
  }
}

new OrderService().run()
// new OrderService() instanceof Loggable   //  TS2359. Still not a thing.

// The value of the combination: the interface documents the contract the
// class advertises, the abstract base carries the shared implementation, and
// consumers can depend on the interface without knowing the class. That
// dependency inversion is the actual reason to use `implements`.

// ---------------------------------------------------------------------------
// interface vs type, for object shapes
// ---------------------------------------------------------------------------
// Both describe a shape. The differences that matter:
//
//  - Merging. Two `interface X` declarations with the same name merge. Two
//    `type X` aliases are a duplicate-identifier error. Declaration merging is
//    how you augment a library's types from outside.
//  - Unions and conditionals. `type` can be `A | B` or a conditional type.
//    `interface` cannot, because an interface names an object type.
//  - Error messages. For a plain object shape, `interface` produces better
//    messages and better hovers, because it has a name the compiler can
//    print. An anonymous type literal used a hundred times is expanded a
//    hundred times in errors.
//
// Rule of thumb: `interface` for object shapes you will name and possibly
// extend; `type` for everything else.

// ---------------------------------------------------------------------------
// The excess property check
// ---------------------------------------------------------------------------
// Assigning an object *literal* to an interface rejects unknown properties:
//   const b: Brewable = { brew() { return "" }, ready: true, extra: 1 }
//   //  TS2353: Object literal may only specify known properties, and 'extra'
//   //  does not exist in type 'Brewable'.
//
// This does not happen for a variable, because a variable has no "extra"
// properties to speak of - it is just a value of some wider type. It is a
// deliberate safety net against typos, and it is also the reason this fails:
//
//   const withExtra = { brew() { return "" }, ready: true, extra: 1 }
//   const b: Brewable = withExtra   //  ok! No error. Not a fresh literal.
//
// So the check protects against a typo you are making right now, not against a
// typo that already got into a variable. Worth knowing before you trust it.

console.log(kettle, press, new OrderService())
export { Kettle, FrenchPress, Service, OrderService }
export type { Brewable, Loggable }
