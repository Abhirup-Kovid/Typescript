// Importing across files, and the four things that bite under NodeNext.

import MENU_DEFAULT, { MENU, priceOf, type CupSize, type Order } from "./chai-menu.js"
// The `.js` is not a typo. The emitted file is `chai-menu.js`, so that is the
// path Node will look for. Writing `./chai-menu` is TS2307 under NodeNext
// resolution, and writing `./chai-menu.ts` is TS5097 (an import path can only
// end with a recognised extension). Neither is a *runtime* error - it is a
// compile error, which is the better of the two failure modes.
//
// Note the two import forms mixed above:
//   - value imports:      MENU, priceOf
//   - type-only imports:  `type CupSize`, `type Order`
// `verbatimModuleSyntax: true` (this project's config) *requires* the `type`
// keyword for types, and it is what lets tsc drop the type import entirely
// from the emitted JS. Without the keyword and with the flag on, you get
//   TS1484: 'CupSize' is a type and must be imported using a type-only import
// when 'verbatimModuleSyntax' is enabled.
//
// That flag is why the emitted file does not try to import a binding that only
// exists at compile time, which used to be the source of real runtime
// ReferenceErrors under CommonJS.

// Re-exporting. The `type` keyword matters here too.
export { MENU, priceOf } from "./chai-menu.js"
export type { CupSize, Order } from "./chai-menu.js"

// ---------------------------------------------------------------------------
// Type-only imports, and why the flag is worth having
// ---------------------------------------------------------------------------
// Without `verbatimModuleSyntax`, tsc would erase an import it believed was
// type-only by *guessing*. When the guess is wrong, the emitted CommonJS
// requires a binding that is not there, and the failure is at runtime with a
// confusing message. The flag removes the guess: you say `type`, tsc believes
// you, and if you are wrong the code does not compile.
//
// It also means the emitted `import` statements look exactly like what you
// wrote, which makes the build output readable - a real benefit when you are
// debugging a bundler config.

// ---------------------------------------------------------------------------
// import type for types you only mention
// ---------------------------------------------------------------------------
import type { Order as OrderShape } from "./chai-menu.js"
type Id = OrderShape["id"]   // string
const anId: Id = "o-1"

// ---------------------------------------------------------------------------
// Dynamic import, and its real type
// ---------------------------------------------------------------------------
// `await import(...)` returns the module *namespace object*, and under
// NodeNext the specifier is again resolved by Node - so it needs the extension
// too. The result type is the module's shape, not `any`, which is a genuine
// improvement over `require`.
// async function load(): Promise<typeof import("./chai-menu.js")> {
//   const mod = await import("./chai-menu.js")
//   return mod
// }

// ---------------------------------------------------------------------------
// Project layout consequences of nodenext
// ---------------------------------------------------------------------------
//   module: nodenext   - format comes from the nearest package.json "type"
//   moduleResolution: nodenext - specifiers are resolved the way Node resolves
//                                them, so extensions are required
//   verbatimModuleSyntax: type-only imports must say so
//
// The payoff is that the compiler's idea of the module graph matches the
// runtime's exactly, so "it compiles but cannot find the module at runtime"
// becomes impossible. The cost is the explicit `.js`, which looks wrong for
// about a week and then stops being noticeable.

// ---------------------------------------------------------------------------
// Barrel files, and why they cost more than they save
// ---------------------------------------------------------------------------
// A barrel re-exports everything, which is convenient until you need to know
// where a symbol came from - a stack trace says `./index.js`, the import says
// `./index.js`, and neither helps. Tree-shaking suffers too, and under
// NodeNext a cycle through a barrel can produce a partially-initialised
// namespace at runtime. Import from the file that defines the thing.

const order: Order = { id: "o-1", size: "medium", sugar: 2 }
const size: CupSize = "large"

console.log(MENU, MENU_DEFAULT, priceOf(order), size, anId, MENU[size])
