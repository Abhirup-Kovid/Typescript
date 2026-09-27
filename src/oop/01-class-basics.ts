// A class is two things at once: a runtime constructor, and a type.
//
//   class Chai { ... }
//
// `Chai` in a type position is the *instance* type. Getting the static side -
// the constructor itself, with its static members - is `typeof Chai`. That
// duality is why you will see both spellings in the same signature.

class Chai {
  // Field. Initialised in the constructor, in declaration order, after
  // super() if there is one.
  name: string
  cups: number

  // A field with no initializer still has to be initialised somewhere, or
  // strictPropertyInitialization rejects it:
  //   sugar: number     ->  TS2564: Property 'sugar' has no initializer and
  //                         is not definitely assigned in the constructor.
  // Three ways out, in order of preference:
  //   1. initialise it here
  //   2. initialise it in the constructor
  //   3. `declare` it - the field exists at runtime but is managed elsewhere
  //   4. `sugar!: number` - definite assignment assertion, a promise
  sugar!: number

  constructor(name: string, cups: number) {
    this.name = name
    this.cups = cups
    this.sugar = 1
  }

  // A method lives on the prototype. `this` is typed as the class instance
  // automatically - no `this` parameter needed inside a class body.
  describe(): string {
    return `${this.name} x${this.cups} (sugar ${this.sugar})`
  }

  // Returning `this` type rather than the class name is what makes a
  // subclass chain keep its own type through the chain.
  addCup(): this {
    this.cups += 1
    return this
  }

  // A getter is a property at runtime and a method in the type. The compiler
  // treats `chai.brewTime` as a number, and the call is not there.
  get brewTime(): number {
    return this.cups * 3
  }

  set brewTime(minutes: number) {
    this.cups = Math.floor(minutes / 3)
  }
}

const chai = new Chai("Masala", 2)
chai.addCup().addCup()
console.log(chai.describe(), chai.brewTime)

chai.brewTime = 30
console.log(chai.cups)   // 10

// ---------------------------------------------------------------------------
// Structural, not nominal
// ---------------------------------------------------------------------------
// Two classes with no relationship in common are assignable if their shapes
// match. `Chai` has no parent, no interface, no nominal identity.
type Describeable = { describe(): string }

function announce(item: Describeable): string {
  return item.describe()
}

class NotAChai {
  describe(): string {
    return "not a chai"
  }
}

announce(chai)          // ok - it has describe()
announce(new NotAChai()) // ok - unrelated class, same shape

// The cost of structural typing, stated plainly: a typo in a method name
// produces "Property 'describe' does not exist" rather than a rename, and
// two unrelated classes can silently satisfy the same interface. That is a
// good trade at a boundary (accept anything shaped like this) and a poor one
// for a domain model where you *want* the compiler to know which class it is.

// ---------------------------------------------------------------------------
// Instance type vs constructor type
// ---------------------------------------------------------------------------
type InstanceOf = Chai           // the instance type
type ConstructorOf = typeof Chai // the class object, with its statics

function make(factory: new (name: string, cups: number) => InstanceOf): InstanceOf {
  return new factory("Generic", 1)
}

make(Chai)   // ok
// make(NotAChai)  //  TS2345, wrong constructor signature

// ---------------------------------------------------------------------------
// Runtime shape, briefly
// ---------------------------------------------------------------------------
// Fields are properties on the instance, methods are on the prototype. This
// matters for two things people hit: `Object.keys` does not list methods, and
// JSON.stringify does not include them.
//
// Also: class bodies run in strict mode, so `this` is `undefined` rather than
// the global object when a method is called with no receiver.
console.log(Object.keys(chai), chai instanceof Chai, chai.constructor === Chai, make(Chai))
export { Chai, announce, make }
export type { Describeable, InstanceOf, ConstructorOf }
