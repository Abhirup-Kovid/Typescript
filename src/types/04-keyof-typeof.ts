// `keyof` and `typeof` are the two type operators that read from a value.
// Everything in the standard library's utility types is built from them.

// ---------------------------------------------------------------------------
// keyof
// ---------------------------------------------------------------------------
type Config = { host: string; port: number; debug?: boolean }

type AllKeys = keyof Config
// "host" | "port" | "debug". Optional keys are included - `keyof` asks what
// keys *may* be present, not what keys are guaranteed.

type RequiredKeys = {
  [K in keyof Config]-?: Config[K]
}
type Opt = keyof RequiredKeys
// "host" | "port". The `-?` modifier stripped optionality, so the key is now
// guaranteed to be there. This is a mapped type doing key bookkeeping, and
// it is the pattern behind `Required<T>`.

type ReadOnlyKeys = {
  readonly [K in keyof Config]: Config[K]
}

declare const cfg: Config
const value: AllKeys = "port"
console.log(cfg[value])   // string | number | boolean | undefined

// The reverse direction: given a value, what keys does its type have?
//   type KeysOf = keyof typeof cfg   // same as keyof Config, because
//                                     // `typeof cfg` is Config
const r1: AllKeys = "host"
console.log(r1, value)

// ---------------------------------------------------------------------------
// keyof on a union is an intersection - the counter-intuitive part
// ---------------------------------------------------------------------------
type A = { a: string; shared: number }
type B = { b: boolean; shared: number }

type UnionKeys = keyof (A | B)
// "shared" only. `keyof` over a union gives the keys that are common to
// *every* member, because the value is always an A or always a B and you can
// only rely on what both guarantee.
//
// The distributive form gives the union instead, and is almost always what
// you meant:
type DistributiveKeys<T> = T extends T ? keyof T : never
type AllKeysOfUnion = DistributiveKeys<A | B>
// "a" | "b" | "shared"
//
// This is the "naked type parameter" rule: a conditional type whose check is
// `T extends T` distributes over the union because T is naked. Covered in
// conditional-types.

// ---------------------------------------------------------------------------
// typeof
// ---------------------------------------------------------------------------
// `typeof x` in a *type* position is the type of the value, with no
// parentheses and no `import type`. It is the bridge from runtime to compile
// time.
const settings = { host: "localhost", port: 8080, tags: ["a"] }
type Settings = typeof settings
// { host: string; port: number; tags: string[] }
// Properties are *widened* - this is a mutable object, so `port` is `number`,
// not `8080`. Use `as const` to keep the literals.

const frozen = { host: "localhost", port: 8080 } as const
type Frozen = typeof frozen
// { readonly host: "localhost"; readonly port: 8080 }

const port: 8080 = frozen.port   // ok. The literal survived.
// const wrong: 3000 = frozen.port   // TS2322: Type '8080' is not assignable
//                                     to type '3000'

// ---------------------------------------------------------------------------
// typeof on a function: the most common use
// ---------------------------------------------------------------------------
function processOrder(id: string, qty: number): boolean {
  return qty > 0 && id.length > 0
}

type ProcessOrder = typeof processOrder
// (id: string, qty: number) => boolean

// `Parameters` and `ReturnType` are built on exactly this, which is why they
// exist: you cannot write `(id: string, qty: number) => boolean` by hand
// without repeating the signature and letting it drift.
type ProcessArgs = Parameters<typeof processOrder>   // [id: string, qty: number]
type ProcessResult = ReturnType<typeof processOrder> // boolean

// ---------------------------------------------------------------------------
// typeof on a class: instance versus static
// ---------------------------------------------------------------------------
class Store {
  static version = "1.0"
  items: string[] = []

  add(item: string): void {
    this.items.push(item)
  }
}

type StoreInstance = Store          // the instance type
type StoreStatic = typeof Store     // the constructor, with `version`

declare const s: StoreStatic
const v = s.version        // string. Only the static side.
// s.items                // TS2339: Property 'items' does not exist on type
//                        // 'typeof Store'. The constructor type does not
//                        // include instance members.

// ---------------------------------------------------------------------------
// typeof in an import, and why import type exists
// ---------------------------------------------------------------------------
// `typeof import("./module")` names the module's *shape* without importing a
// value. It is the way to talk about a module's exports as a type:
//   type Module = typeof import("./some-module")
// It works under `isolatedModules` and with `verbatimModuleSyntax`, and it
// emits nothing. The `import type` spelling is more common in application
// code; `typeof import(...)` is the one to reach for when you cannot add an
// import statement to the current file (a .d.ts, a global scope, a circular
// dependency you do not want to touch).

// ---------------------------------------------------------------------------
// keyof typeof, the combination
// ---------------------------------------------------------------------------
type ConfigKeys = keyof typeof settings
// "host" | "port" | "tags"

// This is the workhorse for building helpers over a config object without
// naming its type:
function get<K extends ConfigKeys>(key: K): (typeof settings)[K] {
  return settings[key]
}
console.log(get("host"), get("port"), get("tags"), port, v, cfg[value], processOrder("1", 1))
export type { Config, AllKeys, RequiredKeys, Opt, ReadOnlyKeys, UnionKeys, DistributiveKeys, AllKeysOfUnion, Settings, Frozen, ProcessOrder, ProcessArgs, ProcessResult, StoreInstance, StoreStatic, ConfigKeys }
