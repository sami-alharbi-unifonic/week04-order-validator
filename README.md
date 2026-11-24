# Week 04 Order Validator
 
A small TypeScript library that checks a checkout order and calculates its total. It uses fictional data only.
 
## How to run
 
You need Node.js 22.12 or newer.
 
```bash
npm install
npx vitest run
npx tsc
```
 
The first command runs the tests. The second checks the types, and no output means no errors.
 
## Rules
 
- Prices are whole numbers in cents. Currency is RSD.
- Shipping is 500 cents, free when the subtotal is over 10000.
- VAT is 20 percent and already included in the prices. It is rounded half up.
- Same SKU on two lines is merged into one.
- Bad lines (unknown SKU, out of stock, too many, quantity 0) each return an issue.
## Test result
 
16 tests passed. `npx tsc` finished with no errors. No blockers.
 
## Known limitations
 
- VAT is not calculated on shipping.
- The catalog is a fixed list in the code.
- No command line demo yet.
 
