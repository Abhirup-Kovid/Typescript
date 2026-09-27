// A union is "one of these types". `A | B` is a single type whose value set
// is the union of A's values and B's values. It is not "A and also B".

type Id = string | number

let id: Id = "abc-1"
id = 42

// A union has *no* properties of its own. Only members present in every
// arm are accessible without narrowing.
type Response =
  | { ok: true; data: string }
  | { ok: false; error: string }

declare const res: Response

// res.data   ->  error: Property 'data' does not exist on type Response.
// Even though *one* arm has `data`. The union does not inherit it.
if (res.ok) {
  // res is now `{ ok: true; data: string }` and res.data is fine.
  console.log(res.data)
} else {
  console.log(res.error)
}

// Order in the union does not matter to assignability, but it does affect
// which arm error messages name first, so a readable order is worth keeping.

// `|` also works on non-object types.
type Nullable = string | null | undefined
type Numeric = number | bigint
type Flags = string | number | boolean | null | undefined

// Beware: `|` is a *union*, not a cross product. `A | B | C` is one type with
// three arms, so there is no way to have "an A and a B" unless you write
// `A & B`. A tuple (`[A, B]`) is how you mean "one of each, in order".

// Union member ordering and `never`: `never` in a union is absorbed, because
// it contributes no values.
type Absorbed = string | never // which is just `string`

// Practical note on how unions behave at call sites: a union of function
// types is not callable unless the parameters are compatible across all
// arms. `((x: string) => void) | ((x: number) => void)` cannot be called at
// all without narrowing. Narrow the value first, then call.

export type { Id, Response, Nullable, Numeric, Flags, Absorbed }
