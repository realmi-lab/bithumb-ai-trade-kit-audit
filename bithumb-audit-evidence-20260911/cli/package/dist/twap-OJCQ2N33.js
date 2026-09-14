#!/usr/bin/env node
import {
  parsePositiveInt,
  toArray,
  toNumber
} from "./chunk-YQV47CJP.js";
import {
  errorLine,
  outputLine,
  printJson,
  printKv,
  printTable
} from "./chunk-FYO6WLZI.js";

// src/commands/twap.ts
async function handleTwapCommand(run, action, v, json) {
  switch (action) {
    case "place":
      return cmdPlace(run, v, json);
    case "list":
      return cmdList(run, v, json);
    case "cancel":
      return cmdCancel(run, v, json);
    default:
      errorLine(`Unknown twap command: ${action}. Run 'bithumb twap --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdPlace(run, v, json) {
  if (!v.market || !v.side || !v.duration || !v.frequency) {
    errorLine("Error: --market, --side, --duration, --frequency required.");
    process.exitCode = 1;
    return;
  }
  if (v.side === "bid" && !v.price) {
    errorLine("Error: --price is required for bid.");
    errorLine("Example: bithumb twap place --market KRW-BTC --side bid --duration 3600 --frequency 60 --price 50000000");
    process.exitCode = 1;
    return;
  }
  if (v.side === "ask" && !v.volume) {
    errorLine("Error: --volume is required for ask.");
    errorLine("Example: bithumb twap place --market KRW-BTC --side ask --duration 1800 --frequency 30 --volume 0.5");
    process.exitCode = 1;
    return;
  }
  const args = {
    market: v.market,
    side: v.side,
    duration: v.duration,
    frequency: v.frequency
  };
  if (v.price) args.price = v.price;
  if (v.volume) args.volume = v.volume;
  const result = await run("twap_place_order", args);
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdList(run, v, json) {
  const args = {};
  if (v.market) args.market = v.market;
  if (v.state) args.state = v.state;
  if (v.orderIds) args.order_ids = toArray(v.orderIds);
  if (v.nextKey) args.next_key = v.nextKey;
  if (v.limit) args.limit = parsePositiveInt("limit", toNumber(v.limit, "limit"));
  if (v.orderBy) args.order_by = v.orderBy;
  const result = await run("twap_get_orders", args);
  const envelope = result.data;
  const items = envelope?.orders ?? [];
  if (json) return printJson(envelope);
  if (!items.length) {
    outputLine("No TWAP orders found");
    return;
  }
  printTable(items.map((o) => renameKey(o, "uuid", "order_id")));
  if (envelope?.has_next) {
    if (envelope.next_key) {
      errorLine(`
Next page: ${nextPageHint(v, envelope.next_key)}`);
    } else {
      errorLine(
        "\n[warning] has_next is true but next_key is missing. Use --json to inspect the raw response."
      );
    }
  }
}
function nextPageHint(v, nextKey) {
  const parts = ["bithumb twap list"];
  if (v.market) parts.push(`--market ${v.market}`);
  if (v.state) parts.push(`--state ${v.state}`);
  if (v.orderIds) parts.push(`--order-ids ${v.orderIds}`);
  if (v.limit) parts.push(`--limit ${v.limit}`);
  if (v.orderBy) parts.push(`--order-by ${v.orderBy}`);
  parts.push(`--next-key ${nextKey}`);
  return parts.join(" ");
}
function renameKey(obj, from, to) {
  if (!(from in obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k === from ? to : k] = v;
  }
  return out;
}
async function cmdCancel(run, v, json) {
  if (!v.algoOrderId) {
    errorLine("Error: --algo-order-id required. Example: bithumb twap cancel --algo-order-id abc-123");
    process.exitCode = 1;
    return;
  }
  const result = await run("twap_cancel_order", { algo_order_id: v.algoOrderId });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
export {
  handleTwapCommand
};
//# sourceMappingURL=twap-OJCQ2N33.js.map