// Getters, setters, and static members. Three different runtime mechanisms
// that people tend to lump together.

class Temperature {
  #celsius!: number

  // A getter with no setter makes the property read-only *from outside*,
  // while staying writable from inside the class. This is the idiom for
  // exposing a computed or validated value without exposing the storage.
  get fahrenheit(): number {
    return this.#celsius * 1.8 + 32
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new RangeError("below absolute zero")
    }
    this.#celsius = value
  }

  get celsius(): number {
    return this.#celsius
  }
}

const temp = new Temperature()
temp.celsius = 100
console.log(temp.fahrenheit, temp.celsius)
// temp.fahrenheit = 32   // TS2540: Cannot assign to 'fahrenheit' because it
//                          // is a read-only property. No setter exists.

// ---------------------------------------------------------------------------
// A getter and a field with the same name collide
// ---------------------------------------------------------------------------
// With `useDefineForClassFields: true` (this project's default, from
// `target: esnext`), a declared field emits a `defineProperty`, which
// *replaces* an accessor defined on the prototype. The result is a silently
// dead getter.
// class Broken {
//   get value() { return 1 }
//   value: number = 2   // this overwrites the getter on the prototype
// }
// new Broken().value   // 2, not 1
//
// Do not mix accessors and fields under the same name. Pick one per property.

// ---------------------------------------------------------------------------
// static
// ---------------------------------------------------------------------------
class Registry {
  private static items = new Map<string, unknown>()

  // A static method's `this` is the class itself, not an instance. The
  // `this: typeof Registry` parameter is implicit, so `this` is already typed
  // correctly inside a static method.
  static register<T>(key: string, value: T): void {
    this.items.set(key, value)
  }

  static get<T>(key: string): T | undefined {
    return this.items.get(key) as T | undefined
  }

  // `this` in a static refers to the class, so `this` in a static method
  // cannot see instance fields. To share per-instance state, put it on the
  // instance; to share per-class state, put it here.
  static count(): number {
    return this.items.size
  }
}

Registry.register("chai", { name: "masala" })
console.log(Registry.get<{ name: string }>("chai"), Registry.count())

// Detaching a static loses `this` at runtime, and the compiler will not stop
// you because it has no `this` parameter for statics by default:
//
//   const reg = Registry.register
//   reg("x", 1)   // TypeError: Cannot read properties of undefined
//
// A `this` parameter works if you need it checked.

// ---------------------------------------------------------------------------
// static blocks
// ---------------------------------------------------------------------------
// A block that runs once, when the class is defined, with access to private
// static state. The right tool for initialising a static structure.
class Env {
  // Not `readonly`: a readonly modifier cannot even be assigned from a static
  // block, and TS2540 proves it. The immutability is expressed in the *type*
  // instead - `Readonly<Record<...>>` plus Object.freeze - which is the
  // version that survives a cast.
  static defaults: Readonly<Record<string, string>>
  private static readonly overrides = new Map<string, string>()

  static {
    Env.defaults = Object.freeze({ NODE_ENV: "development", PORT: "3000" })
  }

  static get(key: string): string {
    return Env.overrides.get(key) ?? Env.defaults[key] ?? ""
  }

  static set(key: string, value: string): void {
    Env.overrides.set(key, value)
  }
}

Env.set("PORT", "8080")
console.log(Env.get("PORT"), Env.get("NODE_ENV"), Env.defaults)

// ---------------------------------------------------------------------------
// static index signature: allowed, and occasionally useful
// ---------------------------------------------------------------------------
// `static` members participate in the class type, so:
//   typeof Registry   includes  register, get, count, and `prototype`
// The `prototype` member is always there and is typed as the instance type.
// `typeof Registry.prototype` is a way to name the instance type when you
// only have the class object - but it is a worse spelling than the class name
// and you will rarely need it.

console.log(temp, Registry)
export { Temperature, Registry, Env }
