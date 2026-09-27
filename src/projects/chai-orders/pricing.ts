// Pricing, as a place where the type system carries real arithmetic
// constraints - and where a `Record` over a union does work that a switch
// would make you maintain by hand.

import { MENU } from "../../modules/chai-menu.js"
import type { CupSize, Milk, Order, Sugar } from "./domain.js"

// ---------------------------------------------------------------------------
// A total map over a union of keys
// ---------------------------------------------------------------------------
// `Record<CupSize, number>` is the whole trick. Because `CupSize` is a union
// derived from the menu, the record must have an entry for *every* size - so
// adding a size to the menu breaks this line until the price is added too. The
// compiler enforces exhaustiveness without a single `if`.
export const BASE_PRICE: Record<CupSize, number> = {
  small: MENU.small,
  medium: MENU.medium,
  large: MENU.large,
}

const MILK_SURCHARGE: Record<Milk["kind"], number> = {
  dairy: 0,
  oat: 0.6,
  none: 0,
}

// A lookup that cannot return `undefined`, because the key space is closed.
// `BASE_PRICE[size]` is `number`, not `number | undefined` - the difference
// between this and a bare object with inferred keys.

// ---------------------------------------------------------------------------
// Sugar, priced by table rather than by arithmetic
// ---------------------------------------------------------------------------
// Tempting: `sugar * 0.5`. Wrong for `0.5`, which would be free. Tables let
// the business rule be data, and keep non-linear pricing honest.
export const SUGAR_PRICE: Record<Sugar, number> = {
  0: 0,
  0.5: 0.4,
  1: 0.8,
  1.5: 1.1,
  2: 1.4,
}

// Sugar keys are numbers, so `Record<Sugar, number>` is checked by *value*,
// not by name - `0` and `0.5` are distinct properties, and `SUGAR_PRICE[0.25]`
// is TS7053.

// ---------------------------------------------------------------------------
// The price function
// ---------------------------------------------------------------------------
export interface PriceBreakdown {
  readonly base: number
  readonly milk: number
  readonly sugar: number
  readonly total: number
}

export function priceOf(size: CupSize, sugar: Sugar, milk: Milk["kind"]): PriceBreakdown {
  const base = BASE_PRICE[size]
  const milkCost = MILK_SURCHARGE[milk]
  const sugarCost = SUGAR_PRICE[sugar]

  return {
    base,
    milk: milkCost,
    sugar: sugarCost,
    total: round2(base + milkCost + sugarCost),
  }
}

// Note what the return type buys: `total` is present, because a `PriceBreakdown`
// has it. There is no way to return a partial breakdown and forget the total -
// the failure mode of the anonymous-object version, where the caller widens
// the type by hand every time.

function round2(value: number): number {
  // `Number(x.toFixed(2))` rather than `+x.toFixed(2)`: the unary plus
  // coerces, and the explicit Number() says so. Same result, one fewer reader
  // to wonder about.
  return Number(value.toFixed(2))
}

// ---------------------------------------------------------------------------
// Float arithmetic, stated once so it is not re-derived
// ---------------------------------------------------------------------------
// `0.1 + 0.2` is 0.30000000000000004, and that is not a TypeScript problem -
// it is IEEE 754. The types are correct; the *values* are approximate. For
// money, keep integers of minor units (paise, cents) and divide once at the
// edge. Worth knowing which layer of the stack owns the problem, because no
// amount of typing fixes it.

// ---------------------------------------------------------------------------
// Pricing an order, and the state-dependent part
// ---------------------------------------------------------------------------
// A queued order has no station yet, a brewing one does, and that difference
// has nothing to do with price - which is exactly why the union is better than
// a flat interface. The compiler knows `order.station` does not exist on a
// queued order, and this function does not care, because it does not read it.
export function price(order: Order): PriceBreakdown {
  return priceOf(order.size, order.sugar, order.milk.kind)
}

// ---------------------------------------------------------------------------
// Summing across orders, generically
// ---------------------------------------------------------------------------
// One function that works for the list and for a single item, without an
// `any` and without a union of array types.
function total<T>(items: readonly T[], value: (item: T) => number): number {
  return round2(items.reduce((sum, item) => sum + value(item), 0))
}

// I left `total(orders, price).valueOf` here for a while, and the compiler
// caught the real error underneath the silly one: `price` returns a
// `PriceBreakdown`, not a `number`, so the function passed as `value` has the
// wrong return type. Two errors from one mistake, and the second is the useful
// one. The fix - and the reason to make `total` generic - is to project first:
//
//   total(orders, (order) => price(order).total)
//
// Which works because `total<T>` infers `T = Order` from the array and leaves
// the projection unconstrained. A `total(values: number[])` signature would
// have needed an intermediate array.
export function revenue(orders: readonly Order[]): number {
  return total(orders, (order) => price(order).total)
}

// ---------------------------------------------------------------------------
// A generic constrained to a priceable shape
// ---------------------------------------------------------------------------
// Worth showing against the alternative. `function priceAll<T extends Order>` is
// more honest but rejects a plain `{ size, sugar, milk }` object, which is
// exactly what a test fixture wants to be. So the constraint is on the *fields
// used*, not on the domain type. This is the generic-constraints lesson from
// src/functions/06 applied to real data.
export interface Priceable {
  readonly size: CupSize
  readonly sugar: Sugar
  readonly milk: Milk
}

export function priceAny<T extends Priceable>(item: T): PriceBreakdown {
  return priceOf(item.size, item.sugar, item.milk.kind)
}
