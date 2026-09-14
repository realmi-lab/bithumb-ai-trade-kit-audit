#!/usr/bin/env node

// src/help/withdraw.ts
var MODULE_HELP = `
Usage: bithumb withdraw <command> [options]

Commands:
  chance                           Get withdrawal availability info
  get                              Get specific withdrawal
  list                             List coin withdrawals
  list-krw                         List KRW withdrawals
  coin                             Withdraw cryptocurrency (CAUTION)
  krw                              Withdraw KRW (CAUTION)
  cancel                           Cancel coin withdrawal
  addresses                        List allowed withdrawal addresses

Run bithumb withdraw <command> --help for command-specific options.

Examples:
  bithumb withdraw chance --currency BTC --net-type BTC
  bithumb withdraw list --currency BTC
  bithumb withdraw addresses
`;
var CHANCE_HELP = `
Usage: bithumb withdraw chance [options]

Get withdrawal availability info (limits, fee, network status) for a currency.

Required:
  --currency <code>             Currency code (e.g., BTC)
  --net-type <type>             Network type (e.g., BTC)

Options:
  (none)

Examples:
  bithumb withdraw chance --currency BTC --net-type BTC
  bithumb withdraw chance --currency USDT --net-type TRX
`;
var GET_HELP = `
Usage: bithumb withdraw get [options]

Get details of a single withdrawal by withdrawal ID or txid for a specific currency.

Required:
  --currency <code>             Currency code (e.g., BTC)

Options:
  --withdrawal-id <id>          Withdrawal ID
  --txid <txid>                 Transaction ID (string; quote values containing
                                spaces or commas, e.g. "2025-07-31 15:12:24.4")

Examples:
  bithumb withdraw get --currency BTC --txid "2025-07-31 15:12:24.407715"
  bithumb withdraw get --currency BTC --withdrawal-id abc-123
`;
var LIST_HELP = `
Usage: bithumb withdraw list [options]

List coin withdrawals, optionally filtered by currency, state, or identifiers.

Required:
  (none \u2014 all filters are optional)

Options:
  --currency <code>             Currency code (e.g., BTC)
  --state <state>               State filter: PROCESSING, DONE, CANCELLED
  --withdrawal-ids <ids>        Filter by withdrawal IDs (comma-separated)
  --txids <txids>               Filter by transaction IDs. JSON array of strings,
                                e.g. '["txid1","txid2"]' (NOT comma-separated \u2014
                                txid values may contain commas/spaces).
                                Identifier fallback: query --txids first; if it
                                returns empty, retry the same values via
                                --withdrawal-ids before concluding "not found".
                                NOTE: a txid containing a space or comma (e.g.
                                "EVENT_COUPON:4,649", "2025-08-04 20:33:13.4")
                                is NOT matchable here (Bithumb list-filter
                                limitation, even when correctly encoded) \u2014 look
                                it up with 'withdraw get --txid "..."' instead.
  --limit <n>                   Results per page (1-100, default: 100)
  --page <n>                    Page number (>=1, default: 1)
  --order-by <order>            Sort order: asc / desc (default: desc)

Examples:
  bithumb withdraw list --currency BTC
  bithumb withdraw list --txids '["2025-07-31 15:12:24.407715","0xabc123"]'
  bithumb withdraw list --state DONE --limit 50 --order-by desc
`;
var LIST_KRW_HELP = `
Usage: bithumb withdraw list-krw [options]

List KRW withdrawals, optionally filtered by state or identifiers.

Required:
  (none \u2014 all filters are optional)

Options:
  --state <state>               State filter: PROCESSING, DONE, CANCELLED
  --withdrawal-ids <ids>        Filter by withdrawal IDs (comma-separated)
  --txids <txids>               Filter by transaction IDs. JSON array of strings,
                                e.g. '["txid1","txid2"]' (NOT comma-separated).
                                KRW: uuids and txids are both numeric \u2014 query
                                --txids first; if it returns empty, retry the
                                same values via --withdrawal-ids.
  --limit <n>                   Results per page (1-100, default: 100)
  --page <n>                    Page number (>=1, default: 1)
  --order-by <order>            Sort order: asc / desc (default: desc)

Examples:
  bithumb withdraw list-krw
  bithumb withdraw list-krw --txids '["55955615"]'
  bithumb withdraw list-krw --state DONE --limit 50
`;
var COIN_HELP = `
Usage: bithumb withdraw coin [options]

Withdraw cryptocurrency to an external address. Initiates a real, irreversible
funds movement.

Required:
  --currency <code>                 Currency code (e.g., BTC)
  --net-type <type>                 Network type (e.g., BTC)
  --amount <amount>                 Withdrawal amount
  --address <addr>                  Withdrawal address

Options:
  --secondary-address <addr>        Secondary address (tag/memo) \u2014 required for
                                    assets/networks that need a destination tag
  --exchange-name <name>            Destination exchange/wallet name. Required
                                    for external withdrawals: CODE ID Connect,
                                    CODE personal, CODE corporation, WHITELIST.
                                    Do not send for internal member-to-member.
  --receiver-type <type>            Receiver type: personal / corporation.
                                    Use only for CODE personal/corporation.
                                    Presence of this flag triggers travel-rule
                                    receiver-info validation; omit it for internal /
                                    CODE ID Connect / WHITELIST withdrawals.
  --receiver-ko-name <name>         Receiver Korean name. personal: \uAC1C\uC778 \uAD6D\uBB38\uBA85;
                                    corporation: \uB300\uD45C\uC790 \uAD6D\uBB38\uBA85 (required for both)
  --receiver-en-name <name>         Receiver English name. personal: \uAC1C\uC778 \uC601\uBB38\uBA85;
                                    corporation: \uB300\uD45C\uC790 \uC601\uBB38\uBA85 (required for both)
  --receiver-corp-ko-name <name>    Corporation Korean name (required: corporation)
  --receiver-corp-en-name <name>    Corporation English name (required: corporation)

Withdrawal type matrix:
  Internal:          --currency --net-type --amount --address
  CODE ID Connect:  base required params + --exchange-name
  CODE personal:    base required params + --exchange-name --receiver-type personal
                    --receiver-ko-name --receiver-en-name
  CODE corporation: base required params + --exchange-name --receiver-type corporation
                    --receiver-corp-ko-name --receiver-corp-en-name
                    --receiver-ko-name --receiver-en-name
  WHITELIST:         base required params + --exchange-name

  --secondary-address is required for any type when the asset/network requires
  a memo/tag (for example XRP Destination Tag).

Examples:
  bithumb withdraw coin --currency BTC --net-type BTC --amount 0.01 \\
    --address bc1q...
  bithumb withdraw coin --currency XRP --net-type XRP --amount 10 \\
    --address rXXXX --secondary-address 12345

Caution:
  - Cryptocurrency withdrawals are IRREVERSIBLE. Once broadcast on-chain, funds
    cannot be recalled \u2014 verify the destination --address (and --secondary-address
    where applicable) character-by-character before submitting.
  - Strongly recommended: pre-register the destination as an allowed address
    (see 'bithumb withdraw addresses') and dry-run with 'bithumb withdraw chance'
    to confirm fees, limits, and network status before initiating.
  - Classify the withdrawal type before execution. External withdrawals require
    --exchange-name; only CODE personal/corporation withdrawals use receiver fields.
`;
var KRW_HELP = `
Usage: bithumb withdraw krw [options]

Withdraw KRW to your registered bank account. Initiates a real, irreversible
funds movement.

Required:
  --amount <amount>             Withdrawal amount (KRW)
  --two-factor-type <type>      2FA type (e.g., kakao)

Options:
  (none)

Examples:
  bithumb withdraw krw --amount 1000000 --two-factor-type kakao

Caution:
  - KRW withdrawal is IRREVERSIBLE once submitted \u2014 funds are sent to the bank
    account registered under your Bithumb identity. Confirm the registered
    bank/account information on the Bithumb site BEFORE invoking this command.
  - 2FA (--two-factor-type) is mandatory. The request will fail without it.
  - The destination account cannot be overridden via CLI flags by design \u2014 to
    change it, update the registered account through Bithumb's official channels.
`;
var CANCEL_HELP = `
Usage: bithumb withdraw cancel [options]

Cancel a pending coin withdrawal by withdrawal ID. Only effective while the
withdrawal is still cancellable (not yet broadcast).

Required:
  --withdrawal-id <id>          Withdrawal ID to cancel

Options:
  (none)

Examples:
  bithumb withdraw cancel --withdrawal-id abc-123
`;
var ADDRESSES_HELP = `
Usage: bithumb withdraw addresses [options]

List the withdrawal addresses pre-registered (allow-listed) on your Bithumb
account. Pre-registration is recommended before invoking 'bithumb withdraw coin'.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb withdraw addresses
`;
var ACTION_HELP = {
  chance: CHANCE_HELP,
  get: GET_HELP,
  list: LIST_HELP,
  "list-krw": LIST_KRW_HELP,
  coin: COIN_HELP,
  krw: KRW_HELP,
  cancel: CANCEL_HELP,
  addresses: ADDRESSES_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=withdraw-3FHOFUMC.js.map