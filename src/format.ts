import type { OrderResult } from "./types";

// 13197 becomes "131.97". Works for whole cents, 0 or more.
export function formatCents(cents: number): string {
  const whole = Math.floor(cents / 100);
  const part = String(cents % 100).padStart(2, "0");
  return `${whole}.${part}`;
}

export function formatResult(result: OrderResult): string {
  if (result.ok) {
    const s = result.summary;
    return [
      "Order is valid.",
      `Subtotal:     ${formatCents(s.subtotalCents)} ${s.currency}`,
      `Shipping:     ${formatCents(s.shippingCents)} ${s.currency}`,
      `Total:        ${formatCents(s.totalCents)} ${s.currency}`,
      `VAT included: ${formatCents(s.vatCents)} ${s.currency}`,
    ].join("\n");
  }

  const count = result.issues.length;
  const title = `Order has ${count} ${count === 1 ? "problem" : "problems"}:`;
  const lines = result.issues.map(
    (issue, index) => `${index + 1}. [${issue.code}] ${issue.message}`,
  );
  return [title, ...lines].join("\n");
}
