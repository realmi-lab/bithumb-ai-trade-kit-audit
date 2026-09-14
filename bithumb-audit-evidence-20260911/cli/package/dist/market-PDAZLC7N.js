#!/usr/bin/env node

// src/help/market.ts
var MODULE_HELP = `
Usage: bithumb market <command> [options]

Commands:
  markets                          List all available markets
  ticker                           Get ticker for market(s) (comma-separated)
  orderbook                        Get orderbook for market(s) (comma-separated)
  trades                           Get recent trades
  candles-minutes                  Get minute candles
  candles-days                     Get daily candles
  candles-weeks                    Get weekly candles
  candles-months                   Get monthly candles
  warnings                         Get virtual asset warning markets
  notices                          Get notice list
  fee-inout                        Get deposit/withdrawal fees

Run bithumb market <command> --help for command-specific options.

Examples:
  bithumb market markets
  bithumb market ticker KRW-BTC
  bithumb market orderbook KRW-BTC --json
  bithumb market candles-minutes KRW-BTC --unit 5 --count 10
`;
var MARKETS_HELP = `
Usage: bithumb market markets [options]

List all available markets on Bithumb.

Required:
  (none)

Options:
  --is-details       Include detailed market info (default: false)

Examples:
  bithumb market markets
  bithumb market markets --is-details --json
`;
var TICKER_HELP = `
Usage: bithumb market ticker <market> [options]

Get ticker (current price snapshot) for one or more markets.

Required:
  <market>           Market identifier(s), comma-separated (e.g., KRW-BTC or KRW-BTC,KRW-ETH)

Options:
  (none)

Examples:
  bithumb market ticker KRW-BTC
  bithumb market ticker KRW-BTC,KRW-ETH --json
`;
var ORDERBOOK_HELP = `
Usage: bithumb market orderbook <market> [options]

Get orderbook (bid/ask depth) for one or more markets.

Required:
  <market>           Market identifier(s), comma-separated (e.g., KRW-BTC or KRW-BTC,KRW-ETH)

Options:
  (none)

Examples:
  bithumb market orderbook KRW-BTC
  bithumb market orderbook KRW-BTC,KRW-ETH --json
`;
var TRADES_HELP = `
Usage: bithumb market trades <market> [options]

Get recent trades (tick history) for a market.

Required:
  <market>           Market identifier (e.g., KRW-BTC)

Options:
  --count <n>        Number of trades to return (1\u2013500) (default: 1)
  --to <time>        Query base time (KST, time-of-day only \u2014 HHmmss or HH:mm:ss, 00:00:00\u201323:59:59). Differs from candles --to: date is not accepted. For past days use --days-ago.
  --cursor <cursor>  Pagination cursor (sequential_id from previous response)
  --days-ago <n>     Filter trades from N days ago (1\u20137). Without this, query targets the current time.

Examples:
  bithumb market trades KRW-BTC --count 50
  bithumb market trades KRW-BTC --days-ago 1
  bithumb market trades KRW-BTC --to 230000
  bithumb market trades KRW-BTC --to 23:00:00 --days-ago 1
`;
var CANDLES_MINUTES_HELP = `
Usage: bithumb market candles-minutes <market> [options]

Get minute-level candles for a market.

Required:
  <market>           Market identifier (e.g., KRW-BTC)

Options:
  --unit <n>         Minute unit (allowed values: 1, 3, 5, 10, 15, 30, 60, 240) (default: 1)
  --count <n>        Number of candles to return (1-200, default: 1)
  --to <datetime>    Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)

Examples:
  bithumb market candles-minutes KRW-BTC --unit 5 --count 10
  bithumb market candles-minutes KRW-BTC --unit 60 --count 24
`;
var CANDLES_DAYS_HELP = `
Usage: bithumb market candles-days <market> [options]

Get daily candles for a market.

Required:
  <market>           Market identifier (e.g., KRW-BTC)

Options:
  --count <n>                       Number of candles to return (1-200, default: 1)
  --to <datetime>                   Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)
  --converting-price-unit <unit>    Convert the close price to KRW for non-KRW markets (e.g., BTC-ETH). Bithumb supports KRW only.
                                    Result is in 'converted_trade_price' \u2014 visible only with --json (default table output omits it).

Examples:
  bithumb market candles-days KRW-BTC --count 30
  bithumb market candles-days BTC-ETH --converting-price-unit KRW --json
`;
var CANDLES_WEEKS_HELP = `
Usage: bithumb market candles-weeks <market> [options]

Get weekly candles for a market.

Required:
  <market>           Market identifier (e.g., KRW-BTC)

Options:
  --count <n>        Number of candles to return (1-200, default: 1)
  --to <datetime>    Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)

Examples:
  bithumb market candles-weeks KRW-BTC --count 12
  bithumb market candles-weeks KRW-BTC --to 2026-01-01T00:00:00
`;
var CANDLES_MONTHS_HELP = `
Usage: bithumb market candles-months <market> [options]

Get monthly candles for a market.

Required:
  <market>           Market identifier (e.g., KRW-BTC)

Options:
  --count <n>        Number of candles to return (1-200, default: 1)
  --to <datetime>    Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)

Examples:
  bithumb market candles-months KRW-BTC --count 12
  bithumb market candles-months KRW-BTC --to 2026-01-01T00:00:00
`;
var WARNINGS_HELP = `
Usage: bithumb market warnings [options]

Get the list of virtual asset warning markets (caution-flagged).

Required:
  (none)

Options:
  (none)

Examples:
  bithumb market warnings
  bithumb market warnings --json
`;
var NOTICES_HELP = `
Usage: bithumb market notices [options]

Get the list of exchange notices.

Required:
  (none)

Options:
  --count <n>        Number of notices to return (1-20, default: 5)

Examples:
  bithumb market notices
  bithumb market notices --count 20
`;
var FEE_INOUT_HELP = `
Usage: bithumb market fee-inout <currency> [options]

Get deposit/withdrawal fee information for a currency.

Required:
  <currency>         Currency code (e.g., BTC, ETH)

Options:
  (none)

Examples:
  bithumb market fee-inout BTC
  bithumb market fee-inout ETH --json
`;
var ACTION_HELP = {
  markets: MARKETS_HELP,
  ticker: TICKER_HELP,
  orderbook: ORDERBOOK_HELP,
  trades: TRADES_HELP,
  "candles-minutes": CANDLES_MINUTES_HELP,
  "candles-days": CANDLES_DAYS_HELP,
  "candles-weeks": CANDLES_WEEKS_HELP,
  "candles-months": CANDLES_MONTHS_HELP,
  warnings: WARNINGS_HELP,
  notices: NOTICES_HELP,
  "fee-inout": FEE_INOUT_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=market-PDAZLC7N.js.map