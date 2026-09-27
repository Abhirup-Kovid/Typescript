// A mapped type transforms every key of a type. It is the mechanism behind
// Partial, Required, Readonly, Pick and Omit.

type User = {
  id: string
  name: string
  age?: number
  readonly createdAt: number
}

// The canonical form. `K in keyof T` iterates the keys; `T[K]` looks up the
// value type for each one.
type Clone<T> = { [K in keyof T]: T[K] }
type UserClone = Clone<User>

// A mapped type is *generic*. Writing one without a parameter is not possible,
// which is why every mapped type in the wild is `<T>`.

// ---------------------------------------------------------------------------
// Modifier remapping
// ---------------------------------------------------------------------------
// You can add or remove `?` and `readonly` on every key at once. The `-` is
// the removal operator.
type RemoveOptional<T> = { [K in keyof T]-?: T[K] }        // this is Required<T>
type AddOptional<T> = { [K in keyof T]+?: T[K] }
type AddReadonly<T> = { readonly [K in keyof T]: T[K] }     // this is Readonly<T>
type RemoveReadonly<T> = { -readonly [K in keyof T]: T[K] }

type UserRequired = RemoveOptional<User>
// { id: string; name: string; age: number; readonly createdAt: number }
// `readonly` is untouched unless you ask for it, and `age` is now required -
// which means a real User without an age is no longer assignable to it.

// ---------------------------------------------------------------------------
// A mapped type can also *change the keys*
// ---------------------------------------------------------------------------
type AddTimestamps<T> = { [K in keyof T]: T[K] } & {
  updatedAt: number
}
// That is an intersection, not a mapped type. To genuinely add keys, you map
// over a union of the original keys plus the new ones:
type WithTimestamps<T> = { [K in keyof T | "createdAt" | "updatedAt"]: T[K & keyof T] }
type UserStamped = WithTimestamps<User>
// The `K & keyof T` trick is what stops the compiler complaining about
// indexing T with a key T does not have.

// ---------------------------------------------------------------------------
// Value remapping with a conditional, and key filtering
// ---------------------------------------------------------------------------
// `as` remaps the key. Combined with a filter, this is how you build
// "the subset of keys whose value is a function" - the shape you want for
// `Omit`, `Pick`, and an event emitter's handler map.
type Getters<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K]
}

type Api = { get: () => string; post: () => void; name: string }
type ApiGetters = Getters<Api>
// { get: () => string; post: () => void } - `name` is filtered out.
//
// The `never[]` in the function check is deliberate: a function accepting
// specific parameters is NOT assignable to `() => unknown`, so
// `T[K] extends () => unknown` misses most real functions. `(...args: never[])
// => unknown` accepts every function signature, because `never` is assignable
// to any parameter type.

// The complement - keys whose value is NOT a function:
type NonGetters<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K]
}

// ---------------------------------------------------------------------------
// Homomorphic mapped types
// ---------------------------------------------------------------------------
// A mapped type is *homomorphic* when it is written as `[K in keyof T]` over a
// bare type parameter, and optionally filtering with `K extends keyof T`.
// Homomorphic mapped types have a special property: **they preserve
// optionality and readonly-ness automatically**, and they distribute over
// unions and over `any`.
type Identity<T> = { [K in keyof T]: T[K] }

// For a homomorphic type, the modifiers are inherited from the source, so
// this already keeps `age?` optional and `createdAt` readonly:
type Copy = Identity<User>

// This one does NOT get the special treatment, so its modifiers are applied
// flatly and the optionality information is lost:
type NotHomomorphic<T> = { [K in keyof T as K]: T[K] }
// Actually the `as` clause is still homomorphic in modern TS. The reliably
// non-homomorphic spelling is one that maps over something other than
// `keyof T` directly, e.g. `{ [K in keyof T & string]: T[K] }` loses nothing
// but `{ [K in keyof T]-?: T[K] }` is homomorphic-and-modified.
//
// The rule of thumb: if you are hand-writing a mapped type and the
// optional/readonly flags surprise you, check whether you broke homomorphicity
// by changing the iteration source. This is why `Required<T>` is written
// exactly as `{ [K in keyof T]-?: T[K] }` - the `-?` is the whole difference
// from `Partial<T>`.

// ---------------------------------------------------------------------------
// What mapped types cannot do
// ---------------------------------------------------------------------------
// - Iterate over the *values* of a union. You can only iterate keys.
// - Change arity. The result has exactly as many keys as the source.
// - Escape the type system. It is still erased; a mapped type over a million
//   keys is a million keys the compiler must check, which shows up as a slow
//   build and a confusing "type instantiation is excessively deep" error.

// ---------------------------------------------------------------------------
// The practical ladder
// ---------------------------------------------------------------------------
// You rarely hand-write a mapped type. You reach for the built-ins first
// (Partial, Required, Readonly, Pick, Omit, Record), and only then write your
// own. But reading them requires knowing this syntax, because that is what
// they are.
type UserPartial = Partial<User>     // all keys optional
type UserPicked = Pick<User, "id">  // { id: string }
type UserOmitted = Omit<User, "id" | "age">
type DeepFreeze = { readonly [K in keyof User]: User[K] }

console.log(userClone)
declare const userClone: UserClone
console.log(userClone, {} as UserPartial, {} as UserPicked, {} as UserOmitted, {} as DeepFreeze)
export type { User, Clone, UserClone, RemoveOptional, AddOptional, AddReadonly, RemoveReadonly, UserRequired, AddTimestamps, WithTimestamps, UserStamped, Getters, Api, ApiGetters, NonGetters, Identity, Copy, UserPartial, UserPicked, UserOmitted, DeepFreeze }
