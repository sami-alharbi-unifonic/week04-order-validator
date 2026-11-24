# Week 04 Order Validator
 
A small TypeScript library that checks a checkout order and calculates its total. It uses fictional data only.
 
## How to run
 
You need Node.js 22.12 or newer.
 
```bash
npm install
npm test
npm run typecheck
```
 
`npm test` runs the tests. `npm run typecheck` checks the types, and no output after the command line means no errors.
 
## Command line demo
 
Run it from the project folder with an order file:
 
```bash
npm run demo -- samples/good-order.json
npm run demo -- samples/bad-order.json
```
 
Sample inputs and their saved outputs are in the `samples` folder. The product list is read from `data/catalog.json`. To use another one, add its path after the order file.
 
The exit code is 0 for a valid order, 1 for an order with problems, and 2 for a bad file or wrong usage.
 
## Rules
 
- Prices are whole numbers in cents. Currency is RSD.
- Shipping is 500 cents, free when the subtotal is over 10000.
- VAT is 20 percent and already included in the item prices and in shipping. It is rounded half up.
- Same SKU on two lines is merged into one.
- Bad lines (unknown SKU, out of stock, too many, quantity 0) each return an issue.
## Test result
 
37 tests passed. `npm run typecheck` finished with no errors. No blockers.
 
## Extra: automatic checks on GitHub
 
The assignment did not ask for a CI pipeline or any automation. It asked for the code, the unit tests, the command line demo, this README and a pull request. I added the pipeline myself as an experiment, because running the tests automatically on every change is the natural next step after writing them.
 
The workflow is in `.github/workflows/ci.yml`. On every push and every pull request, GitHub installs the project, runs the type check and runs the tests. A green tick means both passed, and a red cross means something broke.
 
To check that it really catches mistakes, pull request #2 changed the shipping cost from 500 to 600 on purpose. The check went red with 3 failed tests (`expected 600 to be 500`) while the type check still passed. After the value was changed back to 500, the check turned green.
 
## Known limitations
 
- Only one currency (RSD).
- Messages are in English only.
 
