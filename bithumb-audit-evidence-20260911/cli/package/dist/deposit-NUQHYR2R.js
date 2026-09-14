#!/usr/bin/env node

// src/help/deposit.ts
var MODULE_HELP = `
Usage: bithumb deposit <command> [options]

Commands:
  get                              Get specific deposit
  list                             List coin deposits
  list-krw                         List KRW deposits
  krw                              Request KRW deposit (CAUTION)
  generate-address                 Generate deposit address
  addresses                        List all deposit addresses
  address                          Get specific deposit address

Run bithumb deposit <command> --help for command-specific options.

Examples:
  bithumb deposit list --currency BTC
  bithumb deposit address --currency BTC --net-type BTC
  bithumb deposit addresses
`;
var GET_HELP = `
Usage: bithumb deposit get [options]

Get details of a single deposit by deposit ID or txid for a specific currency.

Required:
  --currency <code>             Currency code (e.g., BTC)

Options:
  --deposit-id <id>             Deposit ID
  --txid <txid>                 Transaction ID (string; quote values containing
                                spaces or commas, e.g. "2025-07-31 15:12:24.4")

Examples:
  bithumb deposit get --currency BTC --txid "2025-07-31 15:12:24.407715"
  bithumb deposit get --currency BTC --deposit-id abc-123
`;
var LIST_HELP = `
Usage: bithumb deposit list [options]

List coin deposits, optionally filtered by currency, state, or identifiers.

Required:
  (none \u2014 all filters are optional)

Options:
  --currency <code>             Currency code (e.g., BTC)
  --state <state>               State filter (UPPERCASE, e.g., DEPOSIT_PROCESSING,
                                DEPOSIT_ACCEPTED, DEPOSIT_CANCELLED). 15 coin
                                deposit states total \u2014 see Bithumb API docs for
                                the full list.
  --deposit-ids <ids>           Filter by deposit IDs (comma-separated)
  --txids <txids>               Filter by transaction IDs. JSON array of strings,
                                e.g. '["txid1","txid2"]' (NOT comma-separated \u2014
                                txid values may contain commas/spaces).
                                Identifier fallback: query --txids first; if it
                                returns empty, retry the same values via
                                --deposit-ids before concluding "not found".
                                NOTE: a txid containing a space or comma (e.g.
                                "EVENT_COUPON:4,649", "2025-07-31 15:12:24.4")
                                is NOT matchable here (Bithumb list-filter
                                limitation, even when correctly encoded) \u2014 look
                                it up with 'deposit get --txid "..."' instead.
  --limit <n>                   Results per page (1-100, default: 100)
  --page <n>                    Page number (>=1, default: 1)
  --order-by <order>            Sort order: asc / desc (default: desc)

Examples:
  bithumb deposit list --currency BTC
  bithumb deposit list --txids '["2025-07-31 15:12:24.407715","0xabc123"]'
  bithumb deposit list --state DEPOSIT_ACCEPTED --limit 50 --order-by desc
`;
var LIST_KRW_HELP = `
Usage: bithumb deposit list-krw [options]

List KRW deposits, optionally filtered by state or identifiers.

Required:
  (none \u2014 all filters are optional)

Options:
  --state <state>               State filter: PROCESSING, ACCEPTED, CANCELLED
  --deposit-ids <ids>           Filter by deposit IDs (comma-separated)
  --txids <txids>               Filter by transaction IDs. JSON array of strings,
                                e.g. '["txid1","txid2"]' (NOT comma-separated).
                                KRW: uuids and txids are both numeric \u2014 query
                                --txids first; if it returns empty, retry the
                                same values via --deposit-ids.
  --limit <n>                   Results per page (1-100, default: 100)
  --page <n>                    Page number (>=1, default: 1)
  --order-by <order>            Sort order: asc / desc (default: desc)

Examples:
  bithumb deposit list-krw
  bithumb deposit list-krw --txids '["1657265"]'
  bithumb deposit list-krw --state ACCEPTED --limit 50
`;
var KRW_HELP = `
Usage: bithumb deposit krw [options]

Request a KRW deposit. Triggers a real KRW deposit procedure tied to your
registered bank/identity \u2014 invoke carefully.

Required:
  --amount <amount>             Deposit amount (KRW)
  --two-factor-type <type>      2FA type (e.g., kakao)

Options:
  (none)

Examples:
  bithumb deposit krw --amount 1000000 --two-factor-type kakao

Caution:
  - This command initiates the official KRW deposit procedure with Bithumb;
    it is not a sandbox call. Confirm the amount and the registered bank
    account on the Bithumb site BEFORE invoking.
  - 2FA (--two-factor-type) is mandatory; the request fails without it.
  - Once submitted, the deposit follows Bithumb's settlement rules and cannot
    be retracted via CLI \u2014 handle support requests through official channels.
`;
var GENERATE_ADDRESS_HELP = `
Usage: bithumb deposit generate-address [options]

Use this only when no deposit address yet exists for the (currency, net-type) pair.

Required:
  --currency <code>             Currency code (e.g., BTC)
  --net-type <type>             Network type (e.g., BTC)

Options:
  (none)

Examples:
  bithumb deposit generate-address --currency BTC --net-type BTC
`;
var ADDRESSES_HELP = `
Usage: bithumb deposit addresses [options]

Return every registered deposit address across all currencies/networks on the account, in one call.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb deposit addresses
`;
var ADDRESS_HELP = `
Usage: bithumb deposit address [options]

Look up a single existing deposit address for the given (currency, net-type). Errors if no address has been generated yet;
use 'bithumb deposit generate-address' first.

Required:
  --currency <code>             Currency code (e.g., BTC)
  --net-type <type>             Network type (e.g., BTC)

Options:
  (none)

Examples:
  bithumb deposit address --currency BTC --net-type BTC
`;
var ACTION_HELP = {
  get: GET_HELP,
  list: LIST_HELP,
  "list-krw": LIST_KRW_HELP,
  krw: KRW_HELP,
  "generate-address": GENERATE_ADDRESS_HELP,
  addresses: ADDRESSES_HELP,
  address: ADDRESS_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=deposit-NUQHYR2R.js.map