// Abstract: "this member exists in the contract, and the implementation lives
// somewhere below."

abstract class Beverage {
  // An abstract property: declared, typed, and required of every subclass,
  // with no runtime existence. There is no `abstract` code.
  abstract readonly name: string

  protected constructor(
    protected readonly volumeMl: number,
    private readonly brewedAt: number = Date.now(),
  ) {}

  // A concrete method with a shared implementation, free to call `this.name`
  // because every subclass has one.
  describe(): string {
    return `${this.name} ${this.volumeMl}ml (age ${
      Date.now() - this.brewedAt
    }ms)`
  }

  // An abstract method: no body, and the whole point of the class is that
  // something below provides one. A subclass that forgets becomes
  // TS2515: Non-abstract class 'X' does not implement inherited abstract
  // member 'brew'.
  abstract brew(): string
}

// Cannot instantiate an abstract class.
// new Beverage()   //  TS2511: Cannot create an instance of an abstract class.

class MasalaChai extends Beverage {
  // Implementing an abstract property means a field with a compatible type,
  // and it can be initialised in the declaration.
  override readonly name = "masala"

  // A public constructor is required here, not inherited by default. A
  // subclass with no explicit constructor gets an implicit one, and when the
  // base's constructor is `protected` that implicit constructor is protected
  // too:
  //
  //   class LemonTea extends Beverage {}          // no constructor
  //   new LemonTea(300)  ->  TS2674: Constructor of class 'Beverage' is
  //                          protected and only accessible within the class
  //                          declaration.
  //
  // The base constructor is protected precisely because a bare `Beverage` is
  // not a usable drink, so exposing that constructor through every subclass
  // would be wrong. Declaring the access explicitly at each subclass makes
  // the decision visible instead of inherited by accident.
  constructor(volumeMl: number, public readonly spiceGrams: number) {
    super(volumeMl)
  }

  // An abstract method is implemented by a method with the same signature.
  override brew(): string {
    return `brewing ${this.name} with ${this.spiceGrams}g cardamom`
  }
}

class LemonTea extends Beverage {
  override readonly name = "lemon"

  constructor(volumeMl: number) {
    super(volumeMl)
  }

  // The `override` keyword is required here under noImplicitOverride, and
  // worth writing even when it is not: it is checked against the base class,
  // so a rename in the base becomes a compile error here rather than an
  // accidental second method.
  override brew(): string {
    return `steeping ${this.name}`
  }
}

const masala = new MasalaChai(200, 3)
const lemon = new LemonTea(300)
console.log(masala.brew(), lemon.brew(), masala.describe(), lemon.describe())

// ---------------------------------------------------------------------------
// What an abstract class actually buys you
// ---------------------------------------------------------------------------
// 1. A shared base with a real implementation, so the shared code lives in one
//    place - that is the difference from an interface, which has no body.
// 2. A *nominal* relationship. `Beverage` is a real value, so `instanceof`
//    works, and a `Beverage`-typed variable cannot hold something that merely
//    has the same members.
// 3. Protected members, which an interface cannot express.
//
// It cannot express:
//  - multiple inheritance. One base class, no exceptions.
//  - anything runtime. `abstract` emits zero bytes; the compiler enforces it.
//
// So: abstract class when you have shared implementation and an is-a
// relationship; interface when you have several unrelated classes and only a
// shared shape.

// ---------------------------------------------------------------------------
// An abstract class with a constructor: the protected rule
// ---------------------------------------------------------------------------
// The base constructor above is `protected`, not `public`. That prevents
// `new Beverage(...)` from outside while still allowing `super(...)` from
// subclasses. Making it public would be a mistake - the base has no
// meaningful `brew()`, so it is not a usable Beverage on its own.
//
// This is the one place `protected` on a constructor is genuinely load-bearing
// rather than decorative.

// ---------------------------------------------------------------------------
// abstract members and interface implementation
// ---------------------------------------------------------------------------
// A concrete class can implement an interface that requires an abstract member
// just by providing it, with no `abstract` keyword and no `override`:
//
// abstract class Report { abstract render(): string }
// class SalesReport extends Report { render() { return "sales" } }
//
// `override` is only required (under noImplicitOverride) when the member
// exists in a *superclass*. Interface members are not inherited members, so
// no `override` is needed for them. That trips people up when they move code
// from a base class to an interface.
console.log(masala, lemon, new LemonTea(1).describe())
export { Beverage, MasalaChai, LemonTea }
