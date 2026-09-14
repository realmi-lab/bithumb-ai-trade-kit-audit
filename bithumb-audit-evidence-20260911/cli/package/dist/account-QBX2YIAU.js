#!/usr/bin/env node
import {
  errorLine,
  outputLine,
  printJson,
  printKv,
  printTable
} from "./chunk-FYO6WLZI.js";

// src/commands/account.ts
async function handleAccountCommand(run, action, v, json) {
  switch (action) {
    case "assets":
      return cmdAssets(run, json);
    case "order-chance":
      return cmdOrderChance(run, v.market, json);
    case "wallet-status":
      return cmdWalletStatus(run, json);
    case "api-keys":
      return cmdApiKeys(run, json);
    default:
      errorLine(`Unknown account command: ${action}. Run 'bithumb account --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdAssets(run, json) {
  const result = await run("account_get_assets", {});
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No assets found");
    return;
  }
  printTable(items.map((b) => ({
    currency: b["currency"],
    balance: b["balance"],
    locked: b["locked"],
    avg_buy_price: b["avg_buy_price"],
    unit_currency: b["unit_currency"]
  })));
}
async function cmdOrderChance(run, market, json) {
  if (!market) {
    errorLine("Error: --market is required. Example: bithumb account order-chance --market KRW-BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("account_get_order_chance", { market });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdWalletStatus(run, json) {
  const result = await run("account_get_wallet_status", {});
  const data = result.data;
  if (json) return printJson(data);
  const items = data;
  if (!items?.length) {
    outputLine("No wallet status data");
    return;
  }
  printTable(items);
}
async function cmdApiKeys(run, json) {
  const result = await run("account_get_api_keys", {});
  const data = result.data;
  if (json) return printJson(data);
  const items = data;
  if (!items?.length) {
    outputLine("No API keys found");
    return;
  }
  printTable(items);
}
export {
  handleAccountCommand
};
//# sourceMappingURL=account-QBX2YIAU.js.map