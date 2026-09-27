// `extends` is a real runtime relationship. `implements` is not. Keeping those
// two straight is most of what there is to know about class hierarchies.

class Drink {
  protected volumeMl: number
  private servedAt: Date | null = null

  constructor(volumeMl: number) {
    this.volumeMl = volumeMl
  }

  serve(): string {
    this.servedAt = new Date()
    return `serving ${this.volumeMl}ml`
  }

  get isServed(): boolean {
    return this.servedAt !== null
  }
}

class Chai extends Drink {
  // `super` has two meanings and both are in scope here.
  //
  // 1. `super()` - the superclass *constructor*. It must run before `this`
  //    exists. In a derived class constructor, `this` is an error until it
  //    has been called: TS17009 / "'super' must be called before accessing
  //    'this' in the constructor of a derived class."
  // 2. `super.method()` - the superclass *implementation*. The prototype
  //    chain, resolved at the point the class was defined, not dynamically.
  //
  //    Consequence: if `Tea` later patches `serve`, `Chai` still calls
  //    `Drink.prototype.serve`. Super calls are not virtual.
  constructor(volumeMl: number, public readonly sugar: number) {
    super(volumeMl)
  }

  override serve(): string {
    // The `override` keyword is optional unless noImplicitOverride is on.
    // It is worth writing anyway: it is checked, so renaming the parent
    // method becomes a compile error instead of an accidental new method.
    return `serving chai (${this.sugar} sugar) from ${super.serve()}`
  }
}

const chai = new Chai(200, 2)
chai.serve()
// chai.volumeMl  ->  TS2445: Property 'volumeMl' is protected and only
//                     accessible within class 'Drink' and its subclasses.
//                     The getter below is the intended door.
console.log(chai.sugar, chai instanceof Drink, chai instanceof Chai)

// ---------------------------------------------------------------------------
// Field initialisation order, which is not the source order you would guess
// ---------------------------------------------------------------------------
// Order in a derived class:
//   1. super() runs, and the base constructor body executes
//   2. derived field initialisers run, in source order
//   3. the rest of the derived constructor body runs
//
// So a base constructor that calls an overridden method will see the derived
// class's fields *uninitialised*. This is the single most confusing thing
// about inheritance in TypeScript and it is inherited from JavaScript, not
// added by the compiler.
class Sneaky extends Drink {
  // Not initialised yet when Drink's constructor runs.
  label = "sneaky"

  constructor() {
    super(100)
  }

  override serve(): string {
    // If Drink's constructor called this, `this.label` would be undefined
    // here, not "sneaky". Drink.serve does not, so this is safe - but the
    // pattern is fragile and worth recognising when you see it.
    return `sneaky ${this.label}`
  }
}

console.log(new Sneaky().serve())

// ---------------------------------------------------------------------------
// Assignability in a hierarchy
// ---------------------------------------------------------------------------
// A derived instance is assignable to a base-typed variable, one way only.
const asDrink: Drink = chai     // ok
// const asChai: Chai = asDrink  //  TS2352: Conversion of type 'Drink' to type
//                              //  'Chai' may be a mistake. Chai has a property
//                              //  'sugar' that Drink does not.
//
// TS2352 is worth recognising: it is the "you probably meant a cast" error,
// and it is distinct from TS2351 for genuinely unrelated types.

// ---------------------------------------------------------------------------
// Overriding rules
// ---------------------------------------------------------------------------
// - A method may be overridden with a subtype of the return type, and the
//   parameters must be *identical* or a supertype (contravariance, per the
//   functions note).
// - A property may only be overridden with a subtype. Widening a property
//   type in a subclass is TS2416: Property 'x' in type 'D' is not assignable
//   to the same property in base type 'B'.
// - `readonly` can be removed in a derived class, but not re-added.
// - Private members are not inherited in the type system: a derived class
//   cannot see them, and a base class cannot see a derived class's privates.
//   Two classes each with a private `id` are unrelated for assignability.

// ---------------------------------------------------------------------------
// When to use extends at all
// ---------------------------------------------------------------------------
// The alternative is composition, and it is usually better:
//
//   class Chai {
//     private readonly drink: Drink
//     serve() { return this.drink.serve() }
//   }
//
// Same behaviour, no field-initialisation-order traps, no super-is-not-virtual
// surprise, and no lock-in to a single base. Reach for `extends` when the
// relationship really is "is a" and you want the subtype to be usable
// wherever the base is. Otherwise delegate.
//
// The compile-time-only alternative, when you want the contract without the
// runtime relationship, is `implements` - see 07-interfaces-implements.

console.log(asDrink, Sneaky)
export { Drink, Chai, Sneaky }
