Week 04 Order Validator
A small TypeScript library that checks a checkout order and calculates its totals before automation sends it. This is a training project and it uses fictional data only.
What it does
Checks every line of an order against a product catalog.
Returns a clear issue for each bad line. Nothing is ignored silently.
For a valid order, calculates the subtotal, shipping, total and the VAT part.
Prices are whole numbers in cents. The currency is RSD.
Requirements
Node.js 22.12 or newer, and npm.
How to run
```bash
git clone <repository url>
cd week04-order-validator
npm install
npx vitest run
npx tsc
```
`npx vitest run` runs the tests. `npx tsc` runs the strict type check, and no output means no errors.
Test catalog
SKU	Name	Price in cents	Stock
SKU-101	Mouse	2599	8
SKU-102	Keyboard	7999	2
SKU-103	Monitor	45999	0
Rules
Topic	Rule
Shipping	500 cents. Free only when the subtotal is over 10000. A subtotal of exactly 10000 still pays shipping.
VAT	20 percent, already included in item prices and not added on top.
VAT rounding	VAT part is subtotal x 20 / 120, rounded half up, using whole number math only.
Duplicate SKU	Lines with the same SKU are merged. Stock is checked on the merged quantity.
Empty order	Not valid. Returns an EMPTY_ORDER issue.
Quantity	Must be a whole number greater than 0.
Inputs	Never changed. The functions return new objects.
Example: valid order
Input: SKU-101 x2 and SKU-102 x1.
```json
{
  "ok": true,
  "summary": {
    "currency": "RSD",
    "subtotalCents": 13197,
    "shippingCents": 0,
    "totalCents": 13197,
    "vatCents": 2200
  }
}
```
Example: bad order
Input: SKU-103 x1, SKU-999 x1, SKU-102 x3, SKU-101 x0.
```
OUT_OF_STOCK | Line 1: SKU-103 (Monitor) is out of stock.
UNKNOWN_SKU | Line 2: SKU "SKU-999" does not exist in the catalog.
INSUFFICIENT_STOCK | Line 3: SKU-102 (Keyboard) you asked for 3 but only 2 in stock.
INVALID_QUANTITY | Line 4: quantity for "SKU-101" must be a whole number greater than 0, but got 0.
```
Each bad line gets its own issue, listed in line order.
Using the library
```ts
import { CATALOG, calculateOrder } from "./src/order";

const result = calculateOrder([{ sku: "SKU-101", quantity: 2 }], CATALOG);

if (result.ok) {
  console.log(result.summary.totalCents);
} else {
  for (const issue of result.issues) {
    console.log(issue.code, issue.message);
  }
}
```
Project structure
```
src/types.ts        Product, CartItem, OrderSummary, ValidationIssue, OrderResult
src/order.ts        validateOrder, calculateOrder, vatIncludedIn, test catalog
src/order.test.ts   16 unit tests
tsconfig.json       strict mode
```
Design decisions
Integer cents everywhere. Decimal numbers like 25.99 can give small rounding errors in JavaScript. Whole cents keep the money math exact.
Result type instead of throwing errors. `calculateOrder` returns either `ok: true` with a summary or `ok: false` with a list of issues. The caller must handle both cases, and TypeScript checks that. Bad orders are normal input, so they are not treated as crashes.
Other choices: duplicate SKUs are merged before the stock check, and the issue fields use `null` instead of optional fields so the types stay clear.
Test evidence
Run on Node.js 22.23.5 with Vitest 5.1.1:
```
Test Files  1 passed (1)
     Tests  16 passed (16)
```
`npx tsc` finished with no errors.
Cases covered: normal basket, small basket with shipping, input not changed, VAT rounding, empty order, duplicate SKU (merge and merged stock check), out of stock, invalid quantity (0, negative, decimal, NaN), shipping limit (just under, exactly at, just over), and the full bad order with four problems.
Blockers: none so far.
Known limitations
VAT is calculated on the item subtotal only. Shipping is not included in the VAT part.
The catalog is a fixed list in code, not a database or an API.
Only one currency (RSD) is supported.
No command line demo yet, so the library is used from code or from the tests.
Messages are in English only.
Follow up items
Add a command line demo with sample input files.
Add a GitHub Actions workflow that runs the tests and the type check on every push and pull request.
Replace the placeholder `test` script in `package.json` with `vitest run`.
Decide with the mentor whether shipping should be part of the VAT calculation.
Mentor review notes
To be filled in by the mentor.
Area	Score from 1 to 5	Notes
Understanding		
Correctness		
Independence		
Quality		
