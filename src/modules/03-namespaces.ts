// Namespaces: the pre-ESM module system. Kept here because you will meet
// them, not because you should reach for them.

namespace Chai {
  // Everything in a namespace is exported unless you say otherwise. This is
  // the opposite default from a module, where nothing is exported.
  export interface Order {
    sugar: number
  }

  export const TAX = 0.05

  // A non-exported member is private *to the namespace*, and unlike `private`
  // it is genuinely inaccessible - not by a lint, but by a compile error that
  // no cast gets past.
  const internalRate = 0.18

  export function price(base: number): number {
    return base * (1 + TAX + internalRate)
  }

  // A namespace can merge with a class, a function, or another namespace.
  // Merging is namespace-only and is the reason `declare namespace` exists in
  // .d.ts files - to add to a type that already has a value.
  export namespace Order {
    export function sugarless(): Order {
      return { sugar: 0 }
    }
  }
}

const order: Chai.Order = { sugar: 2 }
console.log(Chai.price(100), Chai.TAX, Chai.Order.sugarless(), order)

// ---------------------------------------------------------------------------
// Why not to use them for new code
// ---------------------------------------------------------------------------
// 1. The output is a global object plus an IIFE. Nothing about it is scoped to
//    your module; the name is a property on the global namespace at runtime.
// 2. No tree shaking. Bundlers cannot know what you used, because the whole
//    namespace is emitted.
// 3. They mix a type and a value under one name, which is exactly the
//    dual-nature confusion from the classes section, applied globally.
// 4. Babel and most modern toolchains assume ESM, so namespaces are a legacy
//    accommodation.
//
// ---------------------------------------------------------------------------
// What namespaces are still right for
// ---------------------------------------------------------------------------
// 1. **Ambient global declarations.** `declare namespace Express { interface
//    Request { ... } }` in a .d.ts is the only clean way to add to a global
//    that already exists as a value. Merging is the feature that makes it
//    work.
// 2. **Very old CommonJS libraries** that use `export = Foo` with a namespace,
//    where the namespace carries both the type and the constructor.
//
// If you are reaching for a namespace to avoid a naming conflict, a module
// scope or a rename does the same job with none of the downsides.

// ---------------------------------------------------------------------------
// `export =` - the CommonJS shape, and the modern replacement
// ---------------------------------------------------------------------------
// An old-style module is declared as:
//   declare function chai(): void
//   declare namespace chai { interface Options { sugar: number } }
//   export = chai
//
// The consumer imports it with:
//   import chai = require("./chai")   // under nodenext, with esModuleInterop
//
// `import x = require(...)` is the one place where an import is not erased -
// it is a real `require`. Everything else in a module is either ESM syntax or
// erased entirely. That is also why it is a syntax error in a file that is not
// a module, and why it is the only way to consume a CJS module with a
// `module.exports` that has a `.d.ts` describing it.
//
// The replacement, when you control the library: use ESM, and if you must
// support CJS consumers, ship types with `"types"` in package.json and let
// the consumer's interop handle it.

export {}
