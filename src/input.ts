import { readFileSync } from "node:fs";
import type { CartItem, Product } from "./types";

function readJsonFile(path: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Cannot read file "${path}".`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`File "${path}" is not valid JSON.`);
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function isWholeNumberZeroOrMore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function parseCatalog(raw: unknown): Product[] {
  if (!Array.isArray(raw)) {
    throw new Error("Catalog must be a JSON array of products.");
  }
  const items: readonly unknown[] = raw;
  const seen = new Set<string>();

  return items.map((entry, index): Product => {
    const label = `Catalog item ${index + 1}`;
    const { sku, name, priceCents, stock } = asRecord(entry, label);

    if (typeof sku !== "string" || sku === "") {
      throw new Error(`${label}: "sku" must be text and not empty.`);
    }
    if (typeof name !== "string" || name === "") {
      throw new Error(`${label}: "name" must be text and not empty.`);
    }
    if (!isWholeNumberZeroOrMore(priceCents)) {
      throw new Error(`${label}: "priceCents" must be a whole number, 0 or more.`);
    }
    if (!isWholeNumberZeroOrMore(stock)) {
      throw new Error(`${label}: "stock" must be a whole number, 0 or more.`);
    }
    if (seen.has(sku)) {
      throw new Error(`${label}: SKU "${sku}" appears more than once.`);
    }
    seen.add(sku);

    return { sku, name, priceCents, stock };
  });
}

// Only the shape is checked here. Values such as quantity 0 are left for
// validateOrder, so they come back as normal issues.
export function parseCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) {
    throw new Error("Order must be a JSON array of items.");
  }
  const items: readonly unknown[] = raw;

  return items.map((entry, index): CartItem => {
    const label = `Order item ${index + 1}`;
    const { sku, quantity } = asRecord(entry, label);

    if (typeof sku !== "string") {
      throw new Error(`${label}: "sku" must be text.`);
    }
    if (typeof quantity !== "number") {
      throw new Error(`${label}: "quantity" must be a number.`);
    }

    return { sku, quantity };
  });
}

export function loadCatalog(path: string): Product[] {
  return parseCatalog(readJsonFile(path));
}

export function loadCart(path: string): CartItem[] {
  return parseCart(readJsonFile(path));
}
