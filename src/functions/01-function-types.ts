// A function type is just a type. Four ways to write the same one.

type Greet = (name: string) => string

const greet: Greet = (name) => `Hello ${name}`
// `name` is contextually typed from Greet. No annotation needed, and none
// wanted - annotating it would be noise the compiler can check for you.

function greetFn(name: string): string {
  return `Hello ${name}`
}

// Method syntax in a type position, which is a different thing from an
// arrow-type member in one specific way (see below).
type Greeter = {
  greet(name: string): string
}

const greeter: Greeter = {
  greet: (name) => `Hello ${name}`,
}

// ---------------------------------------------------------------------------
// Method syntax vs property syntax: the bivariance difference
// ---------------------------------------------------------------------------
// `m(x: Dog)` is checked *bivariantly* for compatibility: Dog ~ Animal
// passes in either direction.
//   `m: (x: Dog) => void` is checked contravariantly, strictly.
//
// So this is accepted:
type Bivariant = { feed: (food: Dog) => void }
declare const b: Bivariant
b.feed = (food: Animal) => {}   // ok under method-style comparison rules

// and this is not:
type Contravariant = { feed: (food: Dog) => void }
declare const c: Contravariant
// c.feed = (food: Animal) => {}   ->  TS2322 under strictFunctionTypes

// `strictFunctionTypes` (part of `strict`) is what makes the second case fail,
// and it applies to function *properties* but not to *methods*, on purpose:
// methods are usually meant to be overridden, and variance checking breaks
// subclassing far more often than it catches a real bug. Method syntax is
// therefore the pragmatic choice for anything overridable, and the arrow form
// is the safe choice for callbacks and function properties you assign to.

// ---------------------------------------------------------------------------
// `typeof` extracts a function's type without repeating it
// ---------------------------------------------------------------------------
function serve(name: string, cups: number): string {
  return `serving ${cups} of ${name}`
}

type Serve = typeof serve
// typeof serve is (name: string, cups: number) => string

const serve2: Serve = serve
// The most common use of `typeof` on a function. It means the variable keeps
// the signature even if you never wrote it down twice.

// ---------------------------------------------------------------------------
// Parameters are contravariant, return types covariant
// ---------------------------------------------------------------------------
// A function type `A => B` is assignable to `C => D` when:
//   - B is assignable to D   (whatever it returns must still be usable)
//   - C is assignable to A   (it must cope with anything the new caller passes)
//
// The second rule is the counter-intuitive one, and it is correct: a function
// that accepts `Animal` can stand in for one that accepts `Dog`, because it
// already handles everything a Dog could be.
type Animal = { name: string }
type Dog = Animal & { bark(): void }

const handleAny: (a: Animal) => void = (a) => console.log(a.name)
const handleDog: (a: Dog) => void = (a) => a.bark()

// A handler that accepts Animal is safe wherever a Dog-only handler is
// promised, because every Dog is an Animal:
const acceptsDog: (a: Dog) => void = handleAny   // ok

// The reverse fails, and it is the direction that matters:
//
//   const acceptsAnimal: (a: Animal) => void = handleDog
//   -> TS2322: Type '(a: Dog) => void' is not assignable to
//              type '(a: Animal) => void'.
//      Types of parameters 'a' and 'a' are incompatible.
//        Type 'Animal' is not assignable to type 'Dog'.
//          Property 'bark' is missing in type 'Animal' but required in
//          type '{ bark(): void; }'.
//
// Read that error carefully: the compiler is refusing to promise that a
// Dog-only handler can cope with being handed a cat. That is the entire
// meaning of contravariance.
//
// The rule in one line, and it is the thing to memorise: the parameter types
// are checked *backwards*. A value of type T is assignable to `A => B` only
// if T is assignable to `C => D` for some A assignable to C and B assignable
// to D. In practice: check the parameters right-to-left.
//
// It is also why `any` in a parameter position is so contagious - `any` is
// assignable in both directions, so a single `any` parameter disables the
// check for the whole signature.

// ---------------------------------------------------------------------------
// void, never, and undefined in return position
// ---------------------------------------------------------------------------
type VoidFn = () => void
type NeverFn = () => never

// A `void` return type is satisfied by a function that returns *anything* -
// the value is simply discarded. This is deliberate, and it is what lets
// `arr.forEach(x => console.log(x))` typecheck even though the callback
// returns the console.log result.
//   type Loose = () => void
//   const loose: Loose = () => 42    // allowed
//   const strict: () => undefined = () => 42  // error

// The arrow of the reverse: a function returning void is NOT assignable to
// one returning undefined, because the caller might read the result.
//   type NeedsUndefined = () => undefined
//   const needs: NeedsUndefined = (() => {})   // TS2322

// `never` means the function cannot complete. A `() => never` is assignable
// to `() => void` (throwing is a valid way to do nothing) but not to
// `() => number`.
function mustFail(): never {
  throw new Error("unreachable")
}

const safe: VoidFn = mustFail   // ok - a throw satisfies void
// const numeric: () => number = mustFail  // error

console.log(greet("a"), greetFn("b"), greeter.greet("c"), serve2("d", 2), acceptsDog, safe, handleAny, handleDog, b, c)
