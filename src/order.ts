import type {
  CartItem,
  OrderResult,
  Product,
  ValidationIssue,
} from "./types";

export const CURRENCY = "RSD" as const;
export const SHIPPING_CENTS = 600;
export const FREE_SHIPPING_OVER_CENTS = 10000;
export const VAT_PERCENT = 20;

interface MergedLine {
  readonly sku: string;
  readonly quantity: number;
  readonly firstLineIndex: number;
}

function indexCatalog(catalog: readonly Product[]): Map<string, Product> {
  return new Map(catalog.map((p): [string, Product] => [p.sku, p]));
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

// Rounding rule: round half up, using integer math only.
// VAT is already inside the gross price, so VAT = gross * 20 / 120.
// Adding 60 (half of 120) before the integer division rounds half up.
export function vatIncludedIn(grossCents: number): number {
  const denominator = 100 + VAT_PERCENT;
  return Math.floor((grossCents * VAT_PERCENT + denominator / 2) / denominator);
}

// Duplicate SKU rule: lines with the same SKU are merged, and the stock
// check uses the merged quantity.
export function validateOrder(
  cart: readonly CartItem[],
  catalog: readonly Product[],
): ValidationIssue[] {
  if (cart.length === 0) {
    return [
      {
        code: "EMPTY_ORDER",
        message: "The order is empty. Add at least one item.",
        sku: null,
        lineIndex: null,
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  const bySku = indexCatalog(catalog);
  const merged = new Map<string, MergedLine>();

  cart.forEach((item, lineIndex) => {
    let lineIsValid = true;

    if (!bySku.has(item.sku)) {
      issues.push({
        code: "UNKNOWN_SKU",
        message: `Line ${lineIndex + 1}: SKU "${item.sku}" does not exist in the catalog.`,
        sku: item.sku,
        lineIndex,
      });
      lineIsValid = false;
    }

    if (!isValidQuantity(item.quantity)) {
      issues.push({
        code: "INVALID_QUANTITY",
        message: `Line ${lineIndex + 1}: quantity for "${item.sku}" must be a whole number greater than 0, but got ${item.quantity}.`,
        sku: item.sku,
        lineIndex,
      });
      lineIsValid = false;
    }

    if (!lineIsValid) {
      return;
    }

    const existing = merged.get(item.sku);
    if (existing === undefined) {
      merged.set(item.sku, {
        sku: item.sku,
        quantity: item.quantity,
        firstLineIndex: lineIndex,
      });
    } else {
      merged.set(item.sku, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    }
  });

  for (const line of merged.values()) {
    const product = bySku.get(line.sku);
    if (product === undefined) {
      continue;
    }

    if (product.stock === 0) {
      issues.push({
        code: "OUT_OF_STOCK",
        message: `Line ${line.firstLineIndex + 1}: ${product.sku} (${product.name}) is out of stock.`,
        sku: product.sku,
        lineIndex: line.firstLineIndex,
      });
    } else if (line.quantity > product.stock) {
      issues.push({
        code: "INSUFFICIENT_STOCK",
        message: `Line ${line.firstLineIndex + 1}: ${product.sku} (${product.name}) you asked for ${line.quantity} but only ${product.stock} in stock.`,
        sku: product.sku,
        lineIndex: line.firstLineIndex,
      });
    }
  }

  // Show issues in the same order as the lines in the order.
  return issues.sort((a, b) => (a.lineIndex ?? -1) - (b.lineIndex ?? -1));
}

export function calculateOrder(
  cart: readonly CartItem[],
  catalog: readonly Product[],
): OrderResult {
  const issues = validateOrder(cart, catalog);
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const bySku = indexCatalog(catalog);
  let subtotalCents = 0;

  for (const item of cart) {
    const product = bySku.get(item.sku);
    if (product === undefined) {
      throw new Error(`Unreachable: SKU ${item.sku} passed validation but is missing.`);
    }
    subtotalCents += product.priceCents * item.quantity;
  }

  // Free shipping only when the subtotal is OVER the limit (equal still pays).
  const shippingCents =
    subtotalCents > FREE_SHIPPING_OVER_CENTS ? 0 : SHIPPING_CENTS;

  const totalCents = subtotalCents + shippingCents;

  // Item prices and shipping both already include VAT, so the VAT part
  // is taken out of the whole total.
  return {
    ok: true,
    summary: {
      currency: CURRENCY,
      subtotalCents,
      shippingCents,
      totalCents,
      vatCents: vatIncludedIn(totalCents),
    },
  };
}