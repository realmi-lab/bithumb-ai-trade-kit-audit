#!/usr/bin/env node

// src/help/account.ts
var MODULE_HELP = `
Usage: bithumb account <command> [options]

Commands:
  assets                           Get account assets (holdings)
  order-chance                     Get order chance for a market
  wallet-status                    Get wallet deposit/withdrawal status
  api-keys                         Get API key list

Run bithumb account <command> --help for command-specific options.

Examples:
  bithumb account assets
  bithumb account order-chance --market KRW-BTC
  bithumb account wallet-status
`;
var ASSETS_HELP = `
Usage: bithumb account assets [options]

Get all currencies held in the account (each with balance, locked, and avg buy price).

Required:
  (none)

Options:
  (none)

Examples:
  bithumb account assets
  bithumb account assets --json
`;
var ORDER_CHANCE_HELP = `
Usage: bithumb account order-chance --market <market> [options]

Get order chance (available balances and order constraints) for a market.

Required:
  --market <market>  Market identifier (e.g., KRW-BTC)

Options:
  (none)

Examples:
  bithumb account order-chance --market KRW-BTC
  bithumb account order-chance --market KRW-ETH --json
`;
var WALLET_STATUS_HELP = `
Usage: bithumb account wallet-status [options]

Get wallet deposit/withdrawal status for each supported currency.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb account wallet-status
  bithumb account wallet-status --json
`;
var API_KEYS_HELP = `
Usage: bithumb account api-keys [options]

Get the list of API keys associated with the account.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb account api-keys
  bithumb account api-keys --json
`;
var ACTION_HELP = {
  assets: ASSETS_HELP,
  "order-chance": ORDER_CHANCE_HELP,
  "wallet-status": WALLET_STATUS_HELP,
  "api-keys": API_KEYS_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=account-AKQYVHGA.js.map