// The four parameter forms, and what each does to the call site.

declare const source: string

// 1. Required.
function required(a: string): void {
  console.log(a)
}

// 2. Optional. The parameter type silently gains `| undefined`.
function optional(a?: string): void {
  console.log(a)   // a: string | undefined
}
optional()          // ok
optional("x")       // ok
optional(undefined) // ok - and identical to omitting it

// 3. Default. The type does NOT gain `| undefined` at the call site.
function withDefault(a = "chai"): void {
  console.log(a)   // a: string
}
withDefault()      // ok
withDefault("x")   // ok

// The two are not the same, and the difference is the useful part:
//   a?: string        ->  string | undefined. You must handle the gap.
//   a = "chai"        ->  string. The gap is already filled.
//
// A default only applies to `undefined`, not to any other falsy value:
//   withDefault("")   ->  a is "", not "chai". Same for `??` semantics.

// 4. Rest. Always last, always an array type.
function rest(first: string, ...others: number[]): void {
  console.log(first, others)   // others: number[]
}
rest("a")               // others: []
rest("a", 1, 2, 3)       // others: [1, 2, 3]
// rest(1)             ->  error, first is still required

// ---------------------------------------------------------------------------
// Ordering rules
// ---------------------------------------------------------------------------
// A required parameter cannot follow an optional one:
//   function bad(a?: string, b: number) {}   ->  TS1016
// ...because there is no way to call it: you would have to pass `undefined`
// positionally.
//
// A default parameter is *not* optional in the signature sense, so it can be
// followed by a required parameter, and the required one simply wins:
//   function odd(a = 1, b: number) {}   // legal, but `a` is pointless
//
// A rest parameter may follow an optional one:
//   function afterRest(a?: string, ...rest: number[]) {}   // legal

// `T | undefined` spelled out is not the same as `?`.
//   f(x: string | undefined)  -- must be called as f(undefined) or f("a")
//   f(x?: string)             -- can be called as f()

// ---------------------------------------------------------------------------
// Destructured parameters, and the naming gotcha
// ---------------------------------------------------------------------------
type Config = { host: string; port?: number }

function connect({ host, port = 8080 }: Config): void {
  // `port` is `number` here. The default did the narrowing that a rest
  // parameter and an optional property cannot.
  console.log(host, port)
}
connect({ host: "localhost" })

// With `exactOptionalPropertyTypes` on (this repo), `port?: number` means
// "absent means 8080" and it rejects `{ port: undefined }`. That is a
// stronger, more accurate claim than the flag-off behaviour, which silently
// accepts it and then hands you `undefined` where you expected a number.

// Renaming on the way in:
function withDefaults({
  host: hostname = "127.0.0.1",
  port = 3000,
}: Partial<Config> = {}): void {
  console.log(hostname, port)
}
withDefaults()
withDefaults({ port: 4000 })

// ---------------------------------------------------------------------------
// void in parameter position: "I will not use this"
// ---------------------------------------------------------------------------
// `void` as a parameter type means the value is accepted and ignored. It is not
// the same as `_`, and it is not the same as `any`.
function logOnly(value: void): void {
  console.log(value)
}
logOnly(undefined)
// logOnly(42)   ->  TS2345. `void` is not a wildcard for "anything".

// ---------------------------------------------------------------------------
// `arguments` and rest, and why to prefer rest
// ---------------------------------------------------------------------------
function sumAll(...nums: number[]): number {
  // `nums` is a real array: mapable, spreadable, length-checkable. The
  // old-school `arguments` is array-like but not an array, and typing it is
  // awkward. Rest parameters are the modern replacement and they compose with
  // generics in a way `arguments` cannot.
  return nums.reduce((total, n) => total + n, 0)
}

function sumAllT<T extends number[]>(...nums: T): T {
  return nums
}

console.log(required("a"), withDefault(), rest("b", 1), connect({ host: "h" }), withDefaults(), logOnly(undefined), sumAll(1, 2, 3), sumAllT(1, 2), source)
