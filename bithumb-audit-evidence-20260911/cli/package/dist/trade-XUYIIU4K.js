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

// src/commands/trade.ts
import { readFileSync } from "fs";
async function handleTradeCommand(run, action, v, json) {
  switch (action) {
    case "list":
      return cmdList(run, {
        market: v.market,
        state: v.state,
        states: toArray(v.states),
        orderIds: toArray(v.orderIds),
        clientOrderIds: toArray(v.clientOrderIds),
        orderBy: v.orderBy,
        page: parsePositiveInt("page", toNumber(v.page, "page")),
        limit: parsePositiveInt("limit", toNumber(v.limit, "limit")),
        json
      });
    case "get":
      return cmdGet(run, { orderId: v.orderId, clientOrderId: v.clientOrderId, json });
    case "place":
      if (v.ordTypeConflict) {
        errorLine(
          "Error: Both --order-type and --ord-type were provided. Use only --order-type (--ord-type is a deprecated alias)."
        );
        process.exitCode = 1;
        return;
      }
      if (v.ordTypeFromDeprecatedAlias) {
        errorLine("[deprecated] --ord-type is deprecated; use --order-type (same values).");
      }
      return cmdPlace(run, {
        market: v.market,
        side: v.side,
        ordType: v.ordType,
        price: v.price,
        volume: v.volume,
        clientOrderId: v.clientOrderId,
        json
      });
    case "cancel":
      return cmdCancel(run, { orderId: v.orderId, clientOrderId: v.clientOrderId, json });
    case "batch-place":
      return cmdBatchPlace(run, v, json);
    case "batch-cancel":
      return cmdBatchCancel(run, v, json);
    default:
      errorLine(`Unknown trade command: ${action}. Run 'bithumb trade --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdList(run, opts) {
  const args = {};
  if (opts.market) args.market = opts.market;
  if (opts.state) args.state = opts.state;
  if (opts.states) args.states = opts.states;
  if (opts.orderIds) args.order_ids = opts.orderIds;
  if (opts.clientOrderIds) args.client_order_ids = opts.clientOrderIds;
  if (opts.orderBy) args.order_by = opts.orderBy;
  if (opts.page !== void 0) args.page = opts.page;
  if (opts.limit !== void 0) args.limit = opts.limit;
  const result = await run("trade_get_orders", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No orders found");
    return;
  }
  printTable(items.map((o) => ({
    // Display the identifier as `order_id` for consistency with the input flag;
    // the API response carries it in the legacy `uuid` field.
    order_id: o["uuid"],
    market: o["market"],
    side: o["side"],
    ord_type: o["ord_type"],
    price: o["price"],
    volume: o["volume"],
    state: o["state"],
    created_at: o["created_at"]
  })));
}
async function cmdGet(run, opts) {
  if (!opts.orderId && !opts.clientOrderId) {
    errorLine("Error: --order-id or --client-order-id is required. Example: bithumb trade get --order-id abc-123");
    process.exitCode = 1;
    return;
  }
  const args = {};
  if (opts.orderId) args.order_id = opts.orderId;
  if (opts.clientOrderId) args.client_order_id = opts.clientOrderId;
  const result = await run("trade_get_order", args);
  const data = result.data;
  if (opts.json) return printJson(data);
  const display = renameKey(data, "uuid", "order_id");
  printKv(display);
}
function renameKey(obj, from, to) {
  if (!(from in obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k === from ? to : k] = v;
  }
  return out;
}
async function cmdPlace(run, opts) {
  if (!opts.market || !opts.side || !opts.ordType) {
    errorLine("Error: --market, --side, and --order-type are required.");
    errorLine("Example: bithumb trade place --market KRW-BTC --side bid --order-type limit --price 50000000 --volume 0.01");
    errorLine("Note: --ord-type is accepted as a deprecated alias of --order-type.");
    process.exitCode = 1;
    return;
  }
  const args = {
    market: opts.market,
    side: opts.side,
    order_type: opts.ordType
  };
  if (opts.price) args.price = opts.price;
  if (opts.volume) args.volume = opts.volume;
  if (opts.clientOrderId) args.client_order_id = opts.clientOrderId;
  const result = await run("trade_place_order", args);
  const data = result.data;
  if (opts.json) return printJson(data);
  outputLine(`Order placed: ${data["order_id"]}`);
  printKv(data);
}
async function cmdCancel(run, opts) {
  if (!opts.orderId && !opts.clientOrderId) {
    errorLine("Error: --order-id or --client-order-id is required. Example: bithumb trade cancel --order-id abc-123");
    process.exitCode = 1;
    return;
  }
  const args = {};
  if (opts.orderId) args.order_id = opts.orderId;
  if (opts.clientOrderId) args.client_order_id = opts.clientOrderId;
  const result = await run("trade_cancel_order", args);
  const data = result.data;
  if (opts.json) return printJson(data);
  outputLine(`Order cancelled: ${data["order_id"] ?? opts.orderId ?? opts.clientOrderId}`);
  printKv(data);
}
async function cmdBatchPlace(run, v, json) {
  if (!v.file) {
    errorLine("Error: --file is required. Provide a JSON file with batch orders.");
    errorLine("Example: bithumb trade batch-place --file orders.json");
    errorLine('File format: [{"market":"KRW-BTC","side":"bid","order_type":"limit","price":"50000000","volume":"0.01"}]');
    process.exitCode = 1;
    return;
  }
  let raw;
  try {
    raw = readFileSync(v.file, "utf-8");
  } catch {
    errorLine(`Error: File not found: ${v.file}`);
    process.exitCode = 1;
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    errorLine(`Error: Invalid JSON in file: ${v.file}`);
    process.exitCode = 1;
    return;
  }
  const rawBatch = Array.isArray(parsed) ? parsed : parsed?.batch_orders;
  if (!Array.isArray(rawBatch)) {
    errorLine(
      "Error: batch file must be a JSON array, or an object with 'batch_orders' that is an array."
    );
    errorLine(
      'Example: [{"market":"KRW-BTC","side":"bid","order_type":"limit","price":"50000000","volume":"0.01"}]'
    );
    process.exitCode = 1;
    return;
  }
  let normalizedAny = false;
  const batchOrders = [];
  for (let i = 0; i < rawBatch.length; i++) {
    const o = rawBatch[i];
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const obj = o;
      const hasCanonical = "order_type" in obj;
      const hasDeprecated = "ord_type" in obj;
      if (hasCanonical && hasDeprecated) {
        errorLine(
          `Error: batch order at index ${i} has both 'order_type' and 'ord_type'. Use only 'order_type' ('ord_type' is a deprecated alias).`
        );
        process.exitCode = 1;
        return;
      }
      if (!hasCanonical && hasDeprecated) {
        normalizedAny = true;
        const { ord_type, ...rest } = obj;
        batchOrders.push({ ...rest, order_type: ord_type });
        continue;
      }
    }
    batchOrders.push(o);
  }
  if (normalizedAny) {
    errorLine(
      "[notice] batch JSON used 'ord_type'; normalized to canonical 'order_type'. Update your file to use 'order_type'."
    );
  }
  const result = await run("trade_batch_place", { batch_orders: batchOrders });
  const data = result.data;
  if (json) return printJson(data);
  const items = data;
  if (Array.isArray(items)) {
    printTable(items);
  } else {
    printKv(data);
  }
}
async function cmdBatchCancel(run, v, json) {
  const args = {};
  if (v.orderIds) args.order_ids = toArray(v.orderIds);
  if (v.clientOrderIds) args.client_order_ids = toArray(v.clientOrderIds);
  if (!args.order_ids && !args.client_order_ids) {
    errorLine("Error: --order-ids or --client-order-ids required. Example: bithumb trade batch-cancel --order-ids id1,id2");
    process.exitCode = 1;
    return;
  }
  const result = await run("trade_batch_cancel", args);
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
export {
  handleTradeCommand
};
//# sourceMappingURL=trade-XUYIIU4K.js.map