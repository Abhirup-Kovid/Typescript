// Call signatures let an *interface or type* be callable, without giving it a
// class or a function declaration. This is the shape of every callback
// registry, event map, and middleware list in a real codebase.

type Handler = (payload: string) => void

// A bare call signature on a type literal:
type Formatter = (value: number) => string

// A named property holding a function type:
type NamedFormatter = {
  format: (value: number) => string
}

// Both are callable, but they behave differently under the variance rules -
// method syntax is bivariant, arrow-property syntax is contravariant. See
// 01-function-types for the full explanation.

// ---------------------------------------------------------------------------
// A map of named handlers. This is the pattern you will actually use.
// ---------------------------------------------------------------------------
type EventMap = {
  login: (userId: string) => void
  logout: () => void
  orderPlaced: (orderId: string, total: number) => void
}

type EventName = keyof EventMap
// keyof a union-literal object type is the union of its keys, so
//   EventName = "login" | "logout" | "orderPlaced"

// ---------------------------------------------------------------------------
// The pair of types that makes this safe: dispatch + emit
// ---------------------------------------------------------------------------
// `emit` is generic in the event name, and `keyof` is the constraint. The
// result is that `emit("orderPlaced", id, total)` typechecks, the argument
// count is checked, and `emit("orderPlaced", id)` is an error because
// "orderPlaced" resolves to a two-parameter signature.
//
// This is the single most valuable generic pattern in day-to-day code: a
// lookup keyed by a literal, where the *value type* is looked up from the
// same key. It is impossible to express without generics.
//
type EventEmitter = {
  on<K extends EventName>(event: K, handler: EventMap[K]): void
  emit<K extends EventName>(event: K, ...args: Parameters<EventMap[K]>): void
}

const emitter: EventEmitter = {
  on(event, handler) {
    // `event` and `handler` are both correlated here. Inside this body,
    // `event` is narrowed to the specific key, and `handler` has the
    // signature for *that* key - not a union of all three.
    console.log(event, handler)
  },
  emit(event, ...args) {
    console.log(event, args)
  },
}

emitter.on("orderPlaced", (id, total) => console.log(id, total))
// emitter.on("orderPlaced", (id) => {})      ->  TS2322, expected 2 params
// emitter.on("nope", () => {})               ->  TS2345
emitter.emit("logout")
// emitter.emit("login", 1)                   ->  TS2345, string expected

// ---------------------------------------------------------------------------
// The return type of the handler is checked too
// ---------------------------------------------------------------------------
type Middleware = (next: () => void) => void

// The classic middleware signature. `next` is required, which stops the
// chain from silently short-circuiting at a layer that forgot it.
const timing: Middleware = (next) => {
  const started = Date.now()
  next()
  console.log(Date.now() - started)
}

// ---------------------------------------------------------------------------
// Construct signatures
// ---------------------------------------------------------------------------
// The callable-with-`new` analogue. If a type has a construct signature, its
// instances are its instance type.
type Clock = {
  new (start: number): { now(): number }
  readonly kind: "clock"
}

const SystemClock: Clock = class {
  static readonly kind = "clock" as const
  constructor(private start: number) {}
  now(): number {
    return Date.now() - this.start
  }
}

const clock = new SystemClock(0)
clock.now()

// ---------------------------------------------------------------------------
// Why prefer this over a class here?
// ---------------------------------------------------------------------------
// You get a structural contract: anything with the right shape works,
// including a factory function, a closure, or an object literal. A class forces
// a shared prototype and an inheritance relationship you did not ask for.
// The trade-off is the one from the mental-model note: structural typing means
// a typo in a property name shows up as a missing-property error rather than a
// rename, which is a good trade at a boundary and a bad one internally.

const format: Formatter = (v) => v.toFixed(2)
const named: NamedFormatter = { format: (v) => `${v}` }

console.log(emitter, timing, clock, format(1), named.format(2))
export type { EventMap, EventName, EventEmitter, Middleware, Clock, Formatter, Handler, NamedFormatter }
