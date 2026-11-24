import { describe, it, expect } from "vitest";
import { loadCart, loadCatalog, parseCart, parseCatalog } from "./input";

describe("parseCatalog", () => {
  it("accepts a valid catalog", () => {
    const catalog = parseCatalog([
      { sku: "A-1", name: "Thing", priceCents: 100, stock: 3 },
    ]);
    expect(catalog).toEqual([
      { sku: "A-1", name: "Thing", priceCents: 100, stock: 3 },
    ]);
  });

  it("rejects something that is not an array", () => {
    expect(() => parseCatalog({})).toThrow("JSON array");
  });

  it.each([
    ["decimal price", { sku: "A-1", name: "Thing", priceCents: 10.5, stock: 1 }],
    ["negative price", { sku: "A-1", name: "Thing", priceCents: -1, stock: 1 }],
    ["negative stock", { sku: "A-1", name: "Thing", priceCents: 100, stock: -1 }],
    ["missing name", { sku: "A-1", priceCents: 100, stock: 1 }],
    ["empty sku", { sku: "", name: "Thing", priceCents: 100, stock: 1 }],
  ])("rejects %s", (_label, item) => {
    expect(() => parseCatalog([item])).toThrow("Catalog item 1");
  });

  it("rejects a duplicate SKU", () => {
    const item = { sku: "A-1", name: "Thing", priceCents: 100, stock: 1 };
    expect(() => parseCatalog([item, item])).toThrow("more than once");
  });
});

describe("parseCart", () => {
  it("accepts a valid order, including quantity 0", () => {
    expect(parseCart([{ sku: "A-1", quantity: 0 }])).toEqual([
      { sku: "A-1", quantity: 0 },
    ]);
  });

  it("accepts an empty order", () => {
    expect(parseCart([])).toEqual([]);
  });

  it("rejects a quantity that is text", () => {
    expect(() => parseCart([{ sku: "A-1", quantity: "2" }])).toThrow(
      "Order item 1",
    );
  });

  it("rejects an item without a sku", () => {
    expect(() => parseCart([{ quantity: 2 }])).toThrow("Order item 1");
  });
});

describe("loading files", () => {
  it("loads the real catalog file", () => {
    const catalog = loadCatalog("data/catalog.json");
    expect(catalog.map((p) => p.sku)).toEqual(["SKU-101", "SKU-102", "SKU-103"]);
  });

  it("loads a sample order file", () => {
    expect(loadCart("samples/good-order.json")).toHaveLength(2);
  });

  it("gives a clear error for a missing file", () => {
    expect(() => loadCart("samples/does-not-exist.json")).toThrow(
      "Cannot read file",
    );
  });
});
