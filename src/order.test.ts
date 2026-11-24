import { describe, it, expect } from "vitest";
import { calculateOrder, validateOrder, vatIncludedIn } from "./order";
import type {
  CartItem,
  OrderResult,
  OrderSummary,
  Product,
  ValidationIssue,
} from "./types";

const CATALOG: readonly Product[] = [
  { sku: "SKU-101", name: "Mouse", priceCents: 2599, stock: 8 },
  { sku: "SKU-102", name: "Keyboard", priceCents: 7999, stock: 2 },
  { sku: "SKU-103", name: "Monitor", priceCents: 45999, stock: 0 },
];

function okSummary(result: OrderResult): OrderSummary {
  if (!result.ok) {
    throw new Error("Expected ok but got issues: " + JSON.stringify(result.issues));
  }
  return result.summary;
}

function issuesOf(result: OrderResult): readonly ValidationIssue[] {
  if (result.ok) {
    throw new Error("Expected issues but the order was ok");
  }
  return result.issues;
}

describe("normal basket", () => {
  it("calculates SKU-101 x2 and SKU-102 x1", () => {
    const cart: CartItem[] = [
      { sku: "SKU-101", quantity: 2 },
      { sku: "SKU-102", quantity: 1 },
    ];
    const summary = okSummary(calculateOrder(cart, CATALOG));

    expect(summary.currency).toBe("RSD");
    expect(summary.subtotalCents).toBe(13197);
    expect(summary.shippingCents).toBe(0);
    expect(summary.totalCents).toBe(13197);
    expect(summary.vatCents).toBe(2200);
  });

  it("charges shipping for a small basket", () => {
    const summary = okSummary(
      calculateOrder([{ sku: "SKU-101", quantity: 1 }], CATALOG),
    );
    expect(summary.subtotalCents).toBe(2599);
    expect(summary.shippingCents).toBe(500);
    expect(summary.totalCents).toBe(3099);
    // VAT is taken from the whole total, shipping included: 3099 / 6 = 516.5
    expect(summary.vatCents).toBe(517);
  });

  it("does not change the input", () => {
    const cart: CartItem[] = [{ sku: "SKU-101", quantity: 2 }];
    const cartBefore = JSON.stringify(cart);
    const catalogBefore = JSON.stringify(CATALOG);

    calculateOrder(cart, CATALOG);

    expect(JSON.stringify(cart)).toBe(cartBefore);
    expect(JSON.stringify(CATALOG)).toBe(catalogBefore);
  });
});

describe("VAT rounding", () => {
  it("rounds half up", () => {
    expect(vatIncludedIn(13197)).toBe(2200); // 2199.5 goes up
    expect(vatIncludedIn(3)).toBe(1); // 0.5 goes up
    expect(vatIncludedIn(2)).toBe(0); // 0.33 goes down
    expect(vatIncludedIn(120)).toBe(20); // exact
  });
});

describe("empty basket", () => {
  it("returns an EMPTY_ORDER issue", () => {
    const issues = issuesOf(calculateOrder([], CATALOG));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("EMPTY_ORDER");
  });
});

describe("duplicate SKU", () => {
  it("merges lines with the same SKU", () => {
    const cart: CartItem[] = [
      { sku: "SKU-101", quantity: 2 },
      { sku: "SKU-101", quantity: 3 },
    ];
    const summary = okSummary(calculateOrder(cart, CATALOG));
    expect(summary.subtotalCents).toBe(2599 * 5);
  });

  it("checks stock on the merged quantity", () => {
    const cart: CartItem[] = [
      { sku: "SKU-102", quantity: 1 },
      { sku: "SKU-102", quantity: 2 },
    ];
    const issues = issuesOf(calculateOrder(cart, CATALOG));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("INSUFFICIENT_STOCK");
  });
});

describe("out of stock", () => {
  it("rejects SKU-103", () => {
    const issues = issuesOf(
      calculateOrder([{ sku: "SKU-103", quantity: 1 }], CATALOG),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("OUT_OF_STOCK");
    expect(issues[0]?.message).toContain("out of stock");
  });
});

describe("invalid quantity", () => {
  it.each([0, -1, 1.5, Number.NaN])("rejects quantity %s", (quantity) => {
    const issues = issuesOf(
      calculateOrder([{ sku: "SKU-101", quantity }], CATALOG),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("INVALID_QUANTITY");
  });
});

describe("free shipping threshold", () => {
  const catalog: readonly Product[] = [
    { sku: "T-9999", name: "Under", priceCents: 9999, stock: 5 },
    { sku: "T-10000", name: "Exact", priceCents: 10000, stock: 5 },
    { sku: "T-10001", name: "Over", priceCents: 10001, stock: 5 },
  ];

  it("charges shipping just under the limit", () => {
    const summary = okSummary(
      calculateOrder([{ sku: "T-9999", quantity: 1 }], catalog),
    );
    expect(summary.shippingCents).toBe(500);
    expect(summary.totalCents).toBe(10499);
  });

  it("charges shipping exactly at the limit", () => {
    const summary = okSummary(
      calculateOrder([{ sku: "T-10000", quantity: 1 }], catalog),
    );
    expect(summary.shippingCents).toBe(500);
    expect(summary.totalCents).toBe(10500);
  });

  it("gives free shipping just over the limit", () => {
    const summary = okSummary(
      calculateOrder([{ sku: "T-10001", quantity: 1 }], catalog),
    );
    expect(summary.shippingCents).toBe(0);
    expect(summary.totalCents).toBe(10001);
  });
});

describe("bad order with several problems", () => {
  it("returns one issue per bad line and ignores nothing", () => {
    const cart: CartItem[] = [
      { sku: "SKU-103", quantity: 1 },
      { sku: "SKU-999", quantity: 1 },
      { sku: "SKU-102", quantity: 3 },
      { sku: "SKU-101", quantity: 0 },
    ];
    const issues = validateOrder(cart, CATALOG);

    expect(issues.map((i) => i.code)).toEqual([
      "OUT_OF_STOCK",
      "UNKNOWN_SKU",
      "INSUFFICIENT_STOCK",
      "INVALID_QUANTITY",
    ]);
    expect(issues.map((i) => i.lineIndex)).toEqual([0, 1, 2, 3]);
    expect(issues[2]?.message).toContain("only 2 in stock");
  });
});