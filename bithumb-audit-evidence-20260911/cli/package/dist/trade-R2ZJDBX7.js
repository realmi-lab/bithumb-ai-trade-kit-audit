#!/usr/bin/env node

// src/help/trade.ts
var MODULE_HELP = `
Usage: bithumb trade <command> [options]

Commands:
  list                             List orders
  get                              Get order details
  place                            Place a new order
  cancel                           Cancel an order
  batch-place                      Place multiple orders from JSON file (max 20)
  batch-cancel                     Cancel multiple orders (max 30)

Run bithumb trade <command> --help for command-specific options.

Examples:
  bithumb trade list --market KRW-BTC --state wait
  bithumb trade get --order-id abc-123
  bithumb trade place --market KRW-BTC --side bid --order-type limit --price 50000000 --volume 0.01
  bithumb trade cancel --order-id abc-123
  bithumb trade batch-place --file orders.json
`;
var LIST_HELP = `
Usage: bithumb trade list [options]

List orders, optionally filtered by market, state, or identifiers.

Required:
  (none \u2014 all filters are optional)

Options:
  --market <market>             Market identifier (e.g., KRW-BTC)
  --state <state>               Filter by state: wait / watch / done / cancel (default: wait)
  --states <states>             Filter by multiple states (comma-separated)
  --order-ids <ids>             Filter by multiple order IDs (comma-separated, max 100)
  --client-order-ids <ids>      Filter by multiple client order IDs (comma-separated, max 100; each id 1\u201336 chars; letters, digits, hyphens, underscores only)
  --order-by <order>            Sort order: asc / desc (default: desc)
  --page <n>                    Page number (>=1, default: 1)
  --limit <n>                   Results per page (>=1, default: 100)

Note:
  The server defaults to state=wait when no state is given, so --order-ids /
  --client-order-ids lookups of done or cancelled orders return empty unless
  you widen the state. Pass --states wait,done,cancel to include them.
  The auto-order state (watch) cannot be mixed with wait/done/cancel; query it
  separately with --state watch. --state and --states cannot be used together.

Examples:
  bithumb trade list --market KRW-BTC --state wait
  bithumb trade list --state done --order-by desc --limit 50
  bithumb trade list --order-ids id1,id2 --states wait,done,cancel
  bithumb trade list --state watch
`;
var GET_HELP = `
Usage: bithumb trade get [options]

Get details of a single order by order ID or client order ID.

Required (provide one of):
  --order-id <id>               Order ID
  --client-order-id <id>        Client-assigned order ID (1\u201336 chars; letters, digits, hyphens, underscores only)

Options:
  (none)

Examples:
  bithumb trade get --order-id abc-123
  bithumb trade get --client-order-id my-order-001
`;
var PLACE_HELP = `
Usage: bithumb trade place [options]

Place a new order on the specified market.

Required:
  --market <market>             Market identifier (e.g., KRW-BTC)
  --side <side>                 Order side: bid (buy) / ask (sell)
  --order-type <type>           Order type: limit / price / market
  --price <price>               Order price (required for limit / price orders)
  --volume <volume>             Order volume (required for limit / market orders)

Options:
  --client-order-id <id>        Client-assigned order ID for idempotency (1\u201336 chars; letters, digits, hyphens, underscores only)
  --ord-type <type>             (deprecated alias of --order-type)

Examples:
  bithumb trade place --market KRW-BTC --side bid --order-type limit --price 50000000 --volume 0.01
  bithumb trade place --market KRW-BTC --side ask --order-type market --volume 0.01
`;
var CANCEL_HELP = `
Usage: bithumb trade cancel [options]

Cancel an existing order by order ID or client order ID.

Required (provide one of):
  --order-id <id>               Order ID
  --client-order-id <id>        Client-assigned order ID (1\u201336 chars; letters, digits, hyphens, underscores only)

Options:
  (none)

Examples:
  bithumb trade cancel --order-id abc-123
  bithumb trade cancel --client-order-id my-order-001
`;
var BATCH_PLACE_HELP = `
Usage: bithumb trade batch-place --file <path>

Place multiple orders in a single batch from a JSON file (max 20 per call).

Required:
  --file <path>                 Path to a JSON file containing the orders array

Options:
  (none)

JSON file format:
  {
    "batch_orders": [
      { "market": "KRW-BTC", "side": "bid", "order_type": "limit", "price": "50000000", "volume": "0.01" },
      ...
    ]
  }
  Each element: market, side (bid/ask), order_type (limit/price/market), price, volume.
  Optional per element: client_order_id (1\u201336 chars; letters, digits, hyphens, underscores only).
  A bare JSON array is also accepted.

Examples:
  bithumb trade batch-place --file orders.json

Caution:
  - Maximum 20 orders per batch \u2014 requests exceeding this will be rejected.
  - All orders are submitted; partial failures are reported per-order in the response.
  - Validate the JSON file locally before submitting to avoid wasted requests.
`;
var BATCH_CANCEL_HELP = `
Usage: bithumb trade batch-cancel [options]

Cancel multiple orders in a single batch (max 30 per call).

Required (provide one of):
  --order-ids <ids>             Comma-separated list of order IDs
  --client-order-ids <ids>      Comma-separated list of client order IDs (each id 1\u201336 chars; letters, digits, hyphens, underscores only)

Options:
  (none)

Examples:
  bithumb trade batch-cancel --order-ids abc-123,def-456,ghi-789
  bithumb trade batch-cancel --client-order-ids ord-1,ord-2

Caution:
  - Maximum 30 orders per batch \u2014 requests exceeding this will be rejected.
  - Cancellation is best-effort; per-order results are reported in the response.
  - Already-filled or already-cancelled orders are skipped without error.
`;
var ACTION_HELP = {
  list: LIST_HELP,
  get: GET_HELP,
  place: PLACE_HELP,
  cancel: CANCEL_HELP,
  "batch-place": BATCH_PLACE_HELP,
  "batch-cancel": BATCH_CANCEL_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=trade-R2ZJDBX7.js.map