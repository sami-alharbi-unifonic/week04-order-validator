export type Currency = "RSD";

export interface Product {
  readonly sku: string;
  readonly name: string;
  readonly priceCents: number;
  readonly stock: number;
}

export interface CartItem {
  readonly sku: string;
  readonly quantity: number;
}

export interface OrderSummary {
  readonly currency: Currency;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly totalCents: number;
  readonly vatCents: number;
}

export type IssueCode =
  | "EMPTY_ORDER"
  | "UNKNOWN_SKU"
  | "INVALID_QUANTITY"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK";

export interface ValidationIssue {
  readonly code: IssueCode;
  readonly message: string;
  readonly sku: string | null;
  readonly lineIndex: number | null;
}

export type OrderResult =
  | { readonly ok: true; readonly summary: OrderSummary }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };