// Typing async code: what Promise actually promises, and the four places
// async/await is stricter than the syntax suggests.

declare function fetchOrder(id: string): Promise<{ id: string; total: number }>
declare function charge(amount: number): Promise<{ ok: boolean }>
declare function log(message: string): void

// ---------------------------------------------------------------------------
// A Promise<T> is a value that will be a T, or will have failed
// ---------------------------------------------------------------------------
// That is the whole idea, and it is why `T` is not `T | undefined`. The value
// is not "not there yet" - it is not there *at all* until the promise settles,
// and the only way to get it is to await, which is a type error outside an
// async context:
const p = fetchOrder("o-1")
// p.total              -> TS2339, "Property 'total' does not exist on type Promise<...>'

async function place(): Promise<boolean> {
  const order = await p           // { id: string; total: number }
  const result = await charge(order.total)
  return result.ok
}

// ---------------------------------------------------------------------------
// The strictness: Promise<T> is not assignable to Promise<T | undefined>
// ---------------------------------------------------------------------------
// This surprises people who think a promise is a box you can put anything in.
// `Promise` is invariant in its type argument, because a consumer with a
// *setter* could put the wrong value in. So the covariance people expect - T
// widening to T | undefined - does not happen, and the fix is a wrapper.

interface Order { id: string; total: number }

function widen(): Promise<Order | undefined> {
  // const p: Promise<Order> = fetchOrder("o-1")   // TS2322. Correctly rejected.
  // The value cannot vanish, but the *type* you promised includes undefined.
  return fetchOrder("o-1")
}

// Practical version, which is the honest signature - "we may find nothing":
async function findOrder(id: string): Promise<Order | undefined> {
  const order = await fetchOrder(id)
  return order.total > 0 ? order : undefined
}

// ---------------------------------------------------------------------------
// Async functions infer Promise<T>, and there is no such thing as a sync throw
// signature
// ---------------------------------------------------------------------------
async function risky(): Promise<number> {
  throw new Error("nope")   // legal. Returns Promise<number>, rejects.
}

// An async function's return type must be a Promise. This is the error people
// meet when they try to be clever:
//   async function bad(): number { return 1 }      // TS1064
//
// And it is a genuine restriction, not a syntax quibble: an async function
// always returns a promise, so promising `number` would be a lie. `throw` is
// the reason it is a lie in a different way - the rejection is invisible in the
// signature, so the type does not tell you the function can fail. Which brings
// us to error modelling.

// ---------------------------------------------------------------------------
// Await in a loop, sequentially versus concurrently
// ---------------------------------------------------------------------------
// The mistake everyone makes once:
async function sequential(ids: string[]): Promise<Order[]> {
  const orders: Order[] = []
  for (const id of ids) {
    orders.push(await fetchOrder(id))    // one round trip at a time
  }
  return orders
}

async function concurrent(ids: string[]): Promise<Order[]> {
  // Independent operations must not be awaited one at a time.
  return Promise.all(ids.map((id) => fetchOrder(id)))
}

// `Promise.all` is typed as an array of the resolved types, in order - so
// `result[0].total` is checked. That is worth knowing, because the alternative
// people reach for, `forEach` with an async callback, gives you
// `Promise<void>[]` and completes nothing.
async function theWrongWay(ids: string[]): Promise<void> {
  ids.forEach(async (id) => {          // returns void. The callbacks are not awaited.
    await fetchOrder(id)
  })
}

// ---------------------------------------------------------------------------
// The three combinators, and the one difference that matters
// ---------------------------------------------------------------------------
// Promise.all    - waits for all, rejects on the first rejection. Loses the
//                  others' results. Typed as T[].
// Promise.allSettled - waits for all, never rejects. The result is
//                  PromiseSettledResult<T>[], discriminated on `status`.
// Promise.any    - first success wins, rejects with AggregateError if all fail.
// Promise.race   - first settle wins, success or failure. Usually a bug.

async function settling(): Promise<string> {
  const results = await Promise.allSettled([fetchOrder("a"), fetchOrder("b")])

  for (const r of results) {
    if (r.status === "fulfilled") {
      log(r.value.id)          // r.value is { id: string; total: number }
    } else {
      log(r.reason.message)     // r.reason is any
    }
  }
  // Narrowing is by `status`, so `r.value` and `r.reason` are correctly
  // correlated. This is what a discriminated union is for, and the DOM lib
  // uses one.

  return results.filter((r) => r.status === "fulfilled").map((r) => r.value.id).join()
}

// `r.reason` is `any`, not `unknown`, which is an inconsistency in lib.dom
// rather than a decision. Treat it as unknown and narrow.

// ---------------------------------------------------------------------------
// for await...of, and async iterators
// ---------------------------------------------------------------------------
// `for await (const x of asyncIterable)` requires the object to be
// AsyncIterable, and that is the type lib.es2018.asynciterable.d.ts adds. A
// plain array is Iterable but not AsyncIterable, so:
declare const rows: AsyncIterable<{ id: string }>

async function drain(): Promise<string[]> {
  const ids: string[] = []
  for await (const row of rows) {
    ids.push(row.id)
  }
  return ids
}

// You can also make a sync iterable async: `await Promise.all([...rows])` is
// fine for a known finite set and worse for an unbounded stream, where
// `for await` back-pressure is the point.

// ---------------------------------------------------------------------------
// A typed wrapper worth copying
// ---------------------------------------------------------------------------
// Once you are past three levels of `try { await } catch`, the result type is
// nested unions and unreadable. Resolve to a discriminated union at the
// boundary instead of throwing.
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

async function useIt(): Promise<string> {
  const r = await attempt(() => fetchOrder("o-9"))
  return r.ok ? r.value.id : `failed: ${r.error.message}`
  // No try/catch, no `r.value!`. The compiler is telling you which branch
  // cannot have a value, which is the entire point.
}

console.log(place, widen, findOrder, risky, sequential, concurrent, theWrongWay, settling, drain, useIt)
