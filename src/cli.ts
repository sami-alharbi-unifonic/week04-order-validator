import { calculateOrder } from "./order";
import { loadCart, loadCatalog } from "./input";
import { formatResult } from "./format";

const DEFAULT_CATALOG_PATH = "data/catalog.json";

// Exit codes: 0 order is valid, 1 order has problems, 2 bad usage or bad file.
function main(): number {
  const [orderPath, catalogPath = DEFAULT_CATALOG_PATH] = process.argv.slice(2);

  if (orderPath === undefined) {
    console.error("Usage: npx tsx src/cli.ts <order.json> [catalog.json]");
    return 2;
  }

  try {
    const catalog = loadCatalog(catalogPath);
    const cart = loadCart(orderPath);
    const result = calculateOrder(cart, catalog);
    console.log(formatResult(result));
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return 2;
  }
}

process.exitCode = main();
