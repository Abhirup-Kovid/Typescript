// A class with a type parameter, which is how you build a container that
// remembers what it holds.

class Box<T> {
  private value: T

  constructor(value: T) {
    this.value = value
  }

  // Return type `this` rather than `Box<T>`, so a subclass stays a subclass.
  set(value: T): this {
    this.value = value
    return this
  }

  get(): T {
    return this.value
  }

  // A method that transforms the contents, keeping the relationship between
  // input and output in the signature. This is what makes `Box` worth
  // generic rather than holding `unknown`.
  map<U>(fn: (value: T) => U): Box<U> {
    return new Box(fn(this.value))
  }

  // The type parameter appears in a parameter position, so it can be anything
  // the caller wants, and the return type follows.
  orElse<U>(fallback: U): T | U {
    return this.value ?? fallback
  }
}

const stringBox = new Box("chai")
console.log(stringBox.get(), stringBox.set("tea").get())

const lengthBox = stringBox.map((s) => s.length)
// Box<number>, not Box<string>. The compiler tracked the transformation.
console.log(lengthBox.get())

// Inference from the constructor: `new Box("chai")` gives Box<string> with no
// annotation. Without generics this would have to be Box<unknown> plus a cast
// at every get().

// ---------------------------------------------------------------------------
// Constraints on a class type parameter
// ---------------------------------------------------------------------------
// `extends` on a class type parameter works exactly as it does on a function,
// with the same caveat: a constraint is a floor, and the members it unlocks are
// only the ones the constraint declares.
class Registry<T extends { id: string }> {
  private items = new Map<string, T>()

  add(item: T): this {
    this.items.set(item.id, item)
    return this
  }

  get(id: string): T | undefined {
    return this.items.get(id)
  }

  get size(): number {
    return this.items.size
  }
}

type User = { id: string; name: string }
const users = new Registry<User>()
users.add({ id: "u1", name: "ravi" })
console.log(users.get("u1"), users.size)

// users.add({ name: "no id" })   //  TS2345: 'name' is missing, and 'id' is
//                                 //  required by the constraint.

// The constraint earns its keep twice: it validates at `add`, and it lets
// `get(id: string)` work without a second lookup type. With `<T>` instead,
// `get` would have to take a `T` and be useless.

// ---------------------------------------------------------------------------
// Default type parameters
// ---------------------------------------------------------------------------
// A default makes the parameter optional. Constraints come before defaults.
class Cache<K extends string, V = unknown> {
  private store = new Map<K, V>()

  put(key: K, value: V): this {
    this.store.set(key, value)
    return this
  }

  get(key: K): V | undefined {
    return this.store.get(key)
  }
}

// `Cache` has no explicit constructor, so it is `new ()` - zero arguments.
// The default type parameter is about *types*, not about arity. If you want to
// pass data in, declare a constructor; the default and the constructor are
// unrelated mechanisms.
const loose = new Cache<string>()
const typed = new Cache<string, number>()
console.log(loose.get("a"), typed.put("a", 1).get("a"))

// A default of `unknown` is the safe one. `V = any` would make every `get`
// return `any` and quietly delete the checking the class exists to provide.

// ---------------------------------------------------------------------------
// Two type parameters, and a static side that uses them
// ---------------------------------------------------------------------------
// `typeof Cache` is the constructor type, including its static members. This
// is where a static generic helper earns its keep.
class Cache2<K extends string, V> {
  private store = new Map<K, V>()

  constructor(initial?: Readonly<Record<K, V>>) {
    if (initial) {
      for (const key of Object.keys(initial) as K[]) {
        const value = initial[key]
        if (value !== undefined) this.store.set(key, value)
      }
    }
  }

  static create<K extends string, V>(): Cache2<K, V> {
    return new Cache2<K, V>()
  }

  put(key: K, value: V): this {
    this.store.set(key, value)
    return this
  }

  get(key: K): V | undefined {
    return this.store.get(key)
  }
}

const c = Cache2.create<string, number>()
console.log(c.put("a", 1))

// ---------------------------------------------------------------------------
// A generic class implementing a generic interface
// ---------------------------------------------------------------------------
interface Source<T> {
  next(): T | undefined
}

class QueueSource<T> implements Source<T> {
  private items: T[] = []

  push(item: T): this {
    this.items.push(item)
    return this
  }

  next(): T | undefined {
    return this.items.shift()
  }
}

const source: Source<string> = new QueueSource<string>()
console.log(source.next(), new QueueSource<number>().push(1).next())

// `implements Source<T>` here is a real check, and it is the reason `next`
// has exactly the signature it does. Note the interface is generic, so the
// implementation must be generic too - a non-generic class cannot implement
// it without erasing T somewhere.

console.log(stringBox, lengthBox, users, loose, typed, c, source)
export { Box, Registry, Cache, Cache2, QueueSource }
export type { User }
