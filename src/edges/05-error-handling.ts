// Error handling: the only part of a TS codebase where the type system
// refuses to help, and the shapes that make it manageable anyway.

declare function save(order: unknown): Promise<void>
declare function read(): Promise<unknown>

// ---------------------------------------------------------------------------
// `throw` accepts anything, and that is deliberate
// ---------------------------------------------------------------------------
// The signature is `throw (expr: any)`, so `throw "a string"` compiles, as
// does `throw { code: 42 }`. Nothing catches you. The type you see in a
// `catch` is chosen by how the *thrown* value is typed, not declared anywhere.
throwIfBad("ok")

function throwIfBad(value: string): void {
  if (value !== "ok") throw new Error("bad")
}

// The consequence: you cannot know what will arrive. `useUnknownInCatchVariables`
// (on under `strict`) types the catch binding as `unknown` for that reason, and
// the `any` in lib.es5 is the last honest admission in the type system that
// errors are outside it.

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------
// Extending Error is a trap in older targets and a non-trap in modern ones,
// which is worth understanding rather than memorising.
class ValidationError extends Error {
  // `override` is required under `noImplicitOverride` and documents that you
  // are replacing something, not adding to it.
  override name = "ValidationError"
  constructor(
    message: string,
    readonly field: string,
  ) {
    super(message)
    // Required *before* TS 2.2 / ES2015 targets. Since the class fields are
    // defined after super(), `instanceof` worked but `this.message` could be
    // undefined on downlevel targets. Modern targets with proper
    // `Object.setPrototypeOf` handling in Error do not need this, and the
    // line is harmless. Worth keeping if you ever downlevel.
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

try {
  save({ id: "o-1" })
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.field)      // narrowed, and `field` is known
  } else if (error instanceof Error) {
    console.log(error.message)
  } else {
    console.log(String(error))    // someone threw a string
  }
}

// Why narrowing by `instanceof` rather than by a `code` property: instanceof
// survives minification, needs no import, and is checked by the compiler. A
// `code` discriminant needs the class imported, and a wrong code is silently
// undefined at runtime instead of a compile error.

// ---------------------------------------------------------------------------
// The typed wrapper again, because `Result` is the actual answer
// ---------------------------------------------------------------------------
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

type AppError =
  | { kind: "validation"; field: string; message: string }
  | { kind: "network"; status: number; message: string }
  | { kind: "unknown"; message: string }

async function load(): Promise<Result<{ id: string }, AppError>> {
  try {
    const data = await read()
    if (typeof data === "object" && data !== null && "id" in data && typeof data.id === "string") {
      return { ok: true, value: { id: data.id } }
    }
    return { ok: false, error: { kind: "validation", field: "id", message: "missing" } }
  } catch (error) {
    return { ok: false, error: { kind: "unknown", message: String(error) } }
  }
}

// Notice what this bought: the caller gets a *discriminated union* on `kind`,
// so the error branches are exhaustively checkable, where a thrown error was
// an opaque `unknown` you had to guess at.
//
// My first attempt at this was `switch (r.error?.kind)`, on the theory that
// optional chaining would let me skip the success case. TS2339: "Property
// 'error' does not exist on type '{ ok: true; value: ... }'". Which is the
// point of a discriminated union - there is no optional access here, because
// `error` does not exist on the success arm at all, and the fix is the check
// you were avoiding. `?.` is a tool for types that say "may be absent", not a
// way to skip narrowing.
async function consume(): Promise<string> {
  const r = await load()
  if (r.ok) return r.value.id

  switch (r.error.kind) {
    case "validation":
      return r.error.field
    case "network":
      return String(r.error.status)
    case "unknown":
      return r.error.message
    default: {
      // Exhaustive: adding a fourth AppError arm is a compile error here
      // rather than a silently unhandled case.
      const unreachable: never = r.error
      return unreachable
    }
  }
}

// ---------------------------------------------------------------------------
// The rules, as they actually stand
// ---------------------------------------------------------------------------
// 1. `catch (e: unknown)` - the default under `strict`. Narrow with
//    `instanceof`, then with a predicate, then `String(e)`. Never annotate
//    `any` to get past a problem you have not read the error message for.
// 2. `throw new Error(...)`, not a string. A string has no stack trace and
//    no type, so the receiver must handle it with `String(e)` and a guess.
// 3. Do not use an error for control flow across a module boundary. Throwing
//    to signal "not found" is what `Result`/`Option` exist to avoid, and the
//    reason is in point 1: a throw is an untyped hole in the signature.
// 4. Do not swallow. `catch {}` with no handling is a bug with a comment on
//    it; at minimum log and rethrow.
// 5. `Promise` rejections are throws. An `await` inside a `try` catches
//    rejections, but an un-awaited floating promise rejects at the top level
//    and `void someAsync()` explicitly discards it - which is why
//    `no-floating-promises` catches so much.

console.log(throwIfBad, save, read, load, consume, ValidationError)
