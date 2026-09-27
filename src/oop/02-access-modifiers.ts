// Access modifiers: a compile-time fiction, applied to a runtime reality.

class Account {
  // No modifier means `public`. It is the default, and being explicit about
  // it in a public API is a courtesy to the reader.
  public readonly owner: string

  // `protected` - visible inside this class and its subclasses. Not from
  // outside. This is the one that is actually enforced for *derived* code,
  // and it is not enforced for anything else.
  protected balance: number

  // `private` - visible only inside this class body, including subclasses.
  // TS2625: Property 'balance' is protected and only accessible within class
  // 'Account' and its subclasses.
  private auditLog: string[] = []

  // A TS `private` field, from the `#` syntax. This one is real: it is
  // enforced by JavaScript, invisible to `Object.keys`, absent from JSON, and
  // genuinely inaccessible from outside even with a cast.
  #secret: string

  constructor(owner: string, openingBalance: number, secret: string) {
    this.owner = owner
    this.balance = openingBalance
    this.#secret = secret
  }

  // A method that exposes private state without exposing the field. The
  // controlled-access pattern, and the reason `private` is useful at all.
  public getBalance(): number {
    return this.balance
  }

  public setBalance(amount: number): void {
    if (amount < 0) {
      throw new Error("balance cannot be negative")
    }
    this.balance = amount
    this.auditLog.push(`set ${amount}`)
  }

  public getHistory(): readonly string[] {
    // Returning `readonly string[]` rather than `string[]` stops the caller
    // from reaching in and mutating the array. The private field is exposed;
    // the reference is not.
    return this.auditLog
  }

  public peekSecret(): string {
    return this.#secret
  }
}

const account = new Account("ravi", 100, "s3cr3t")
account.setBalance(150)
console.log(account.getBalance(), account.getHistory(), account.peekSecret())

// account.balance = 1     // TS2445: protected, only within Account
// account.auditLog = []   // TS2341: private
// account.owner = "x"     // TS2540: readonly
// account.#secret         // TS18016, and genuinely a runtime SyntaxError

// ---------------------------------------------------------------------------
// The honest summary of each modifier
// ---------------------------------------------------------------------------
//   public     - no check. Everything is public by default.
//   protected  - checked against `this` being an instance of the declaring
//                class or a subclass. Bypassed by a subclass, or by a cast.
//   private    - checked against the declaring class body only. A subclass
//                cannot see it. Bypassed by a cast, or by bracket access.
//   #field     - enforced at runtime by the language. Not bypassable without
//                reflection on the prototype chain.
//
// The gap between `private` and `#` is the thing to internalise: TypeScript's
// modifiers are a lint, not a lock. They stop accidental use and they
// document intent. They do not stop a determined caller, and they do not
// survive `as any`.
//
// The rule of thumb: `private` for "do not use this from here", `#` for
// "do not use this from anywhere". Use both sparingly, and prefer returning
// the narrow type (`readonly string[]`) over relying on a modifier.

// ---------------------------------------------------------------------------
// readonly
// ---------------------------------------------------------------------------
// Two different meanings, and they behave differently:
//   - `readonly` on a *property*: it cannot be reassigned. The object it
//     points to can still be mutated.
//   - `readonly T[]` / `ReadonlyArray<T>`: the array cannot be mutated
//     through this reference.
//
// The first does not imply the second, which is why `getHistory` has to return
// `readonly string[]` explicitly. That is the most common gap in review.

class Counter {
  readonly id: number
  mutableTags: string[] = []

  constructor(id: number) {
    this.id = id
  }
}

const counter = new Counter(1)
counter.mutableTags.push("a")   // allowed. `readonly` was not on the field.
// counter.id = 2               // TS2540

console.log(counter.id, counter.mutableTags, account)
export { Account, Counter }
