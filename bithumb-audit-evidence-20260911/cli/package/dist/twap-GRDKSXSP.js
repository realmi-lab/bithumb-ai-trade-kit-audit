#!/usr/bin/env node

// src/help/twap.ts
var MODULE_HELP = `
Usage: bithumb twap <command> [options]

Commands:
  place                            Place a TWAP order
  list                             List TWAP orders
  cancel                           Cancel a TWAP order

Run bithumb twap <command> --help for command-specific options.

Examples:
  bithumb twap place --market KRW-BTC --side bid --duration 3600 --frequency 60 --price 50000000
  bithumb twap list --market KRW-BTC
  bithumb twap cancel --algo-order-id abc-123
`;
var PLACE_HELP = `
Usage: bithumb twap place [options]

Place a TWAP (Time-Weighted Average Price) order, splitting execution over a
duration at a fixed frequency.

Required:
  --market <market>             Market identifier (e.g., KRW-BTC)
  --side <side>                 Order side: bid / ask
  --duration <seconds>          Total duration in seconds (300-43200)
  --frequency <seconds>         Slice frequency: 15, 20, 30, 60, 120

Options:
  --price <price>               Order price (required for bid)
  --volume <volume>             Order volume (required for ask)

Examples:
  bithumb twap place --market KRW-BTC --side bid --duration 3600 --frequency 60 --price 50000000
  bithumb twap place --market KRW-BTC --side ask --duration 1800 --frequency 30 --volume 0.5
`;
var LIST_HELP = `
Usage: bithumb twap list [options]

List TWAP orders, optionally filtered by market or state.

Required:
  (none)

Options:
  --market <market>             Market identifier (e.g., KRW-BTC)
  --state <state>               Order state: progress / done / cancel (default: progress)
  --order-ids <ids>             Filter by TWAP order IDs (comma-separated)
  --order-by <order>            Sort order: asc / desc (default: desc)
  --next-key <key>              Pagination cursor (from a previous page's hint)
  --limit <n>                   Results per page (>=1, default: 100)

Output:
  The default table is a summary view showing key columns only; --json emits the
  full API response. When more results remain, a next-page hint is printed to
  stderr (so it never contaminates piped table data): run the shown command
  as-is to fetch the following page. The hint re-emits your filter/sort options
  (--state, --market, etc.) alongside the cursor, because the cursor alone does
  not re-apply them. The cursor fields (has_next / next_key) are always present
  in --json output.

Examples:
  bithumb twap list --market KRW-BTC
  bithumb twap list --state done --order-by desc --limit 20
  bithumb twap list --market KRW-BTC --next-key <next_key>
`;
var CANCEL_HELP = `
Usage: bithumb twap cancel [options]

Cancel a TWAP order by its algo-order-id.

Required:
  --algo-order-id <id>          TWAP order ID

Options:
  (none)

Examples:
  bithumb twap cancel --algo-order-id abc-123
`;
var ACTION_HELP = {
  place: PLACE_HELP,
  list: LIST_HELP,
  cancel: CANCEL_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=twap-GRDKSXSP.js.map