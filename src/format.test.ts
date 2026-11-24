import { describe, it, expect } from "vitest";
import { formatCents, formatResult } from "./format";

describe("formatCents", () => {
  it.each([
    [0, "0.00"],
    [5, "0.05"],
    [500, "5.00"],
    [13197, "131.97"],
  ])("formats %s as %s", (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });
});

describe("formatResult", () => {
  it("shows a valid order", () => {
    const text = formatResult({
      ok: true,
      summary: {
        currency: "RSD",
        subtotalCents: 13197,
        shippingCents: 0,
        totalCents: 13197,
        vatCents: 2200,
      },
    });
    expect(text).toContain("Order is valid.");
    expect(text).toContain("Total:        131.97 RSD");
    expect(text).toContain("VAT included: 22.00 RSD");
  });

  it("shows every issue", () => {
    const text = formatResult({
      ok: false,
      issues: [
        { code: "UNKNOWN_SKU", message: "first", sku: "X", lineIndex: 0 },
        { code: "INVALID_QUANTITY", message: "second", sku: "Y", lineIndex: 1 },
      ],
    });
    expect(text).toContain("Order has 2 problems:");
    expect(text).toContain("1. [UNKNOWN_SKU] first");
    expect(text).toContain("2. [INVALID_QUANTITY] second");
  });
});
