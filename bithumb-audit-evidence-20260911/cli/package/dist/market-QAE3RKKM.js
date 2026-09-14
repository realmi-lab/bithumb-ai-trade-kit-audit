#!/usr/bin/env node
import {
  parseEnumInt,
  parseKstDatetime,
  parseKstTimeOfDay,
  parseRangedInt,
  toNumber
} from "./chunk-YQV47CJP.js";
import {
  errorLine,
  outputLine,
  printJson,
  printTable
} from "./chunk-FYO6WLZI.js";

// src/commands/market.ts
async function handleMarketCommand(run, action, rest, v, json) {
  switch (action) {
    case "markets":
      return cmdMarkets(run, { isDetails: v.isDetails, json });
    case "ticker":
      return cmdTicker(run, rest[0] ?? v.market, json);
    case "orderbook":
      return cmdOrderbook(run, rest[0] ?? v.market, json);
    case "trades":
      return cmdTrades(run, rest[0] ?? v.market, {
        count: parseRangedInt("count", toNumber(v.count, "count"), 1, 500),
        to: parseKstTimeOfDay(v.to),
        cursor: v.cursor,
        daysAgo: parseRangedInt("days-ago", toNumber(v.daysAgo, "days-ago"), 1, 7),
        json
      });
    case "candles-minutes":
      return cmdCandlesMinutes(run, rest[0] ?? v.market, {
        unit: parseEnumInt("unit", toNumber(v.unit, "unit"), [1, 3, 5, 10, 15, 30, 60, 240]) ?? 1,
        count: parseRangedInt("count", toNumber(v.count, "count"), 1, 200),
        to: parseKstDatetime(v.to),
        json
      });
    case "candles-days":
      return cmdCandlesDays(run, rest[0] ?? v.market, {
        count: parseRangedInt("count", toNumber(v.count, "count"), 1, 200),
        to: parseKstDatetime(v.to),
        convertingPriceUnit: v.convertingPriceUnit,
        json
      });
    case "candles-weeks":
      return cmdCandlesWeeks(run, rest[0] ?? v.market, {
        count: parseRangedInt("count", toNumber(v.count, "count"), 1, 200),
        to: parseKstDatetime(v.to),
        json
      });
    case "candles-months":
      return cmdCandlesMonths(run, rest[0] ?? v.market, {
        count: parseRangedInt("count", toNumber(v.count, "count"), 1, 200),
        to: parseKstDatetime(v.to),
        json
      });
    case "warnings":
      return cmdWarnings(run, json);
    case "notices":
      return cmdNotices(run, { count: parseRangedInt("count", toNumber(v.count, "count"), 1, 20), json });
    case "fee-inout":
      return cmdFeeInout(run, rest[0] ?? v.currency, json);
    default:
      errorLine(`Unknown market command: ${action}. Run 'bithumb market --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdMarkets(run, opts) {
  const result = await run("market_get_markets", {
    ...opts.isDetails !== void 0 && { isDetails: opts.isDetails }
  });
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No markets found");
    return;
  }
  printTable(items.map((m) => ({
    market: m["market"],
    korean_name: m["korean_name"],
    english_name: m["english_name"],
    ...opts.isDetails ? { market_warning: m["market_warning"] ?? "" } : {}
  })));
}
async function cmdTicker(run, markets, json) {
  if (!markets) {
    errorLine("Error: market argument required. Example: bithumb market ticker KRW-BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("market_get_ticker", { markets });
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No ticker data");
    return;
  }
  printTable(items.map((t) => ({
    market: t["market"],
    trade_price: t["trade_price"],
    signed_change_rate: t["signed_change_rate"],
    acc_trade_volume_24h: t["acc_trade_volume_24h"],
    high_price: t["high_price"],
    low_price: t["low_price"]
  })));
}
async function cmdOrderbook(run, markets, json) {
  if (!markets) {
    errorLine("Error: market argument required. Example: bithumb market orderbook KRW-BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("market_get_orderbook", { markets });
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No orderbook data");
    return;
  }
  for (const book of items) {
    outputLine(`
--- ${book["market"]} ---`);
    outputLine(`Total Ask Size: ${book["total_ask_size"]}`);
    outputLine(`Total Bid Size: ${book["total_bid_size"]}`);
    const units = book["orderbook_units"];
    if (units?.length) {
      printTable(units.slice(0, 10).map((u) => ({
        ask_price: u["ask_price"],
        ask_size: u["ask_size"],
        bid_price: u["bid_price"],
        bid_size: u["bid_size"]
      })));
    }
  }
}
async function cmdTrades(run, market, opts) {
  if (!market) {
    errorLine("Error: market argument required. Example: bithumb market trades KRW-BTC");
    process.exitCode = 1;
    return;
  }
  const args = { market };
  if (opts.count !== void 0) args.count = opts.count;
  if (opts.to !== void 0) args.to = opts.to;
  if (opts.cursor !== void 0) args.cursor = opts.cursor;
  if (opts.daysAgo !== void 0) args.daysAgo = opts.daysAgo;
  const result = await run("market_get_trades", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No trades found");
    return;
  }
  printTable(items.map((t) => ({
    trade_date_utc: t["trade_date_utc"],
    trade_time_utc: t["trade_time_utc"],
    trade_price: t["trade_price"],
    trade_volume: t["trade_volume"],
    ask_bid: t["ask_bid"]
  })));
}
async function cmdCandlesMinutes(run, market, opts) {
  if (!market) {
    errorLine("Error: market argument required");
    process.exitCode = 1;
    return;
  }
  const args = { market, unit: opts.unit };
  if (opts.count !== void 0) args.count = opts.count;
  if (opts.to !== void 0) args.to = opts.to;
  const result = await run("market_get_candles_minutes", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No candle data");
    return;
  }
  printTable(items.map((c) => ({
    candle_date_time_kst: c["candle_date_time_kst"],
    opening_price: c["opening_price"],
    high_price: c["high_price"],
    low_price: c["low_price"],
    trade_price: c["trade_price"],
    candle_acc_trade_volume: c["candle_acc_trade_volume"]
  })));
}
async function cmdCandlesDays(run, market, opts) {
  if (!market) {
    errorLine("Error: market argument required");
    process.exitCode = 1;
    return;
  }
  const args = { market };
  if (opts.count !== void 0) args.count = opts.count;
  if (opts.to !== void 0) args.to = opts.to;
  if (opts.convertingPriceUnit !== void 0) args.convertingPriceUnit = opts.convertingPriceUnit;
  const result = await run("market_get_candles_days", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No candle data");
    return;
  }
  printTable(items.map((c) => ({
    candle_date_time_kst: c["candle_date_time_kst"],
    opening_price: c["opening_price"],
    high_price: c["high_price"],
    low_price: c["low_price"],
    trade_price: c["trade_price"],
    candle_acc_trade_volume: c["candle_acc_trade_volume"]
  })));
}
async function cmdCandlesWeeks(run, market, opts) {
  if (!market) {
    errorLine("Error: market argument required");
    process.exitCode = 1;
    return;
  }
  const args = { market };
  if (opts.count !== void 0) args.count = opts.count;
  if (opts.to !== void 0) args.to = opts.to;
  const result = await run("market_get_candles_weeks", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No candle data");
    return;
  }
  printTable(items.map((c) => ({
    candle_date_time_kst: c["candle_date_time_kst"],
    opening_price: c["opening_price"],
    high_price: c["high_price"],
    low_price: c["low_price"],
    trade_price: c["trade_price"],
    candle_acc_trade_volume: c["candle_acc_trade_volume"]
  })));
}
async function cmdCandlesMonths(run, market, opts) {
  if (!market) {
    errorLine("Error: market argument required");
    process.exitCode = 1;
    return;
  }
  const args = { market };
  if (opts.count !== void 0) args.count = opts.count;
  if (opts.to !== void 0) args.to = opts.to;
  const result = await run("market_get_candles_months", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No candle data");
    return;
  }
  printTable(items.map((c) => ({
    candle_date_time_kst: c["candle_date_time_kst"],
    opening_price: c["opening_price"],
    high_price: c["high_price"],
    low_price: c["low_price"],
    trade_price: c["trade_price"],
    candle_acc_trade_volume: c["candle_acc_trade_volume"]
  })));
}
async function cmdWarnings(run, json) {
  const result = await run("market_get_warnings", {});
  const data = result.data;
  if (json) return printJson(data);
  const items = data;
  if (!items?.length) {
    outputLine("No warnings found");
    return;
  }
  printTable(items);
}
async function cmdNotices(run, opts) {
  const args = {};
  if (opts.count !== void 0) args.count = opts.count;
  const result = await run("market_get_notices", args);
  const data = result.data;
  if (opts.json) return printJson(data);
  const items = data;
  if (!items?.length) {
    outputLine("No notices found");
    return;
  }
  printTable(items);
}
async function cmdFeeInout(run, currency, json) {
  if (!currency) {
    errorLine("Error: currency argument required. Example: bithumb market fee-inout BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("market_get_fee_inout", { currency });
  const data = result.data;
  if (json) return printJson(data);
  const items = data;
  if (Array.isArray(items) && items.length) {
    printTable(items);
    return;
  }
  printJson(data);
}
export {
  handleMarketCommand
};
//# sourceMappingURL=market-QAE3RKKM.js.map