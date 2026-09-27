// ES modules, under `module: nodenext`.
//
// The one thing to internalise about this setup: the specifier in an import is
// resolved by *Node at runtime*, and Node does no extension guessing. So a
// local import must name the emitted `.js` file, not the `.ts` source. tsc
// rewrites nothing about the specifier - it emits your import verbatim.

export type CupSize = "small" | "medium" | "large"

export const MENU: Record<CupSize, number> = {
  small: 10,
  medium: 20,
  large: 30,
}

export interface Order {
  readonly id: string
  size: CupSize
  sugar: number
}

export function priceOf(order: Order): number {
  return MENU[order.size]
}

// A default export, for comparison. Prefer named exports: they are greppable,
// they cannot be renamed silently by a consumer, and two defaults in one
// project is a question nobody wants to answer.
export default MENU
