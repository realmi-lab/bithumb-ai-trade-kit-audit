#!/usr/bin/env node
import {
  BithumbApiError
} from "./chunk-Y64A2CTR.js";
import {
  parseEnumString,
  parseJsonStringArray,
  parsePositiveInt,
  parseRangedInt,
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

// src/commands/deposit.ts
var DEPOSIT_KRW_STATES = ["PROCESSING", "ACCEPTED", "CANCELLED"];
var DEPOSIT_COIN_STATES = [
  "REQUESTED_PENDING",
  "REQUESTED_SYSTEM_REJECTED",
  "REQUESTED_PROCESSING",
  "REQUESTED_ADMIN_REJECTED",
  "DEPOSIT_PROCESSING",
  "DEPOSIT_ACCEPTED",
  "DEPOSIT_CANCELLED",
  "REFUNDING_PENDING",
  "REFUNDING_SYSTEM_REJECTED",
  "REFUNDING_PROCESSING",
  "REFUNDING_ADMIN_REJECTED",
  "REFUNDING_ACCEPTED",
  "REFUNDED_PROCESSING",
  "REFUNDED_ACCEPTED",
  "REFUNDED_CANCELLED"
];
async function handleDepositCommand(run, action, v, json) {
  switch (action) {
    case "get":
      return cmdGet(run, v, json);
    case "list":
      return cmdList(run, v, json);
    case "list-krw":
      return cmdListKrw(run, v, json);
    case "krw":
      return cmdKrw(run, v, json);
    case "generate-address":
      return cmdGenerateAddress(run, v, json);
    case "addresses":
      return cmdAddresses(run, json);
    case "address":
      return cmdAddress(run, v, json);
    default:
      errorLine(`Unknown deposit command: ${action}. Run 'bithumb deposit --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdGet(run, v, json) {
  if (!v.currency) {
    errorLine("Error: --currency required. Example: bithumb deposit get --currency BTC --deposit-id abc-123");
    process.exitCode = 1;
    return;
  }
  const args = { currency: v.currency };
  if (v.depositId) args.deposit_id = v.depositId;
  if (v.txid) args.txid = v.txid;
  try {
    const result = await run("deposit_get", args);
    const data = result.data;
    if (!data || typeof data === "object" && Object.keys(data).length === 0) {
      outputLine("No deposit found.");
      return;
    }
    if (json) return printJson(data);
    printKv(renameKey(data, "uuid", "deposit_id"));
  } catch (err) {
    if (err instanceof BithumbApiError) {
      const codeNum = Number(err.code);
      const codeStr = err.code ?? "";
      const errNamePattern = /not.?found|invalid|forbidden|unauthorized|bad.?request/i;
      const messagePattern = /not.?found|invalid/i;
      const isClientError = Number.isFinite(codeNum) && codeNum >= 400 && codeNum < 500 || errNamePattern.test(codeStr) || messagePattern.test(err.message);
      if (isClientError) {
        errorLine(`Error: deposit not found or invalid request (${err.code}). ${err.message}`);
        process.exitCode = 1;
        return;
      }
      errorLine(`Error: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
async function cmdList(run, v, json) {
  const args = {};
  if (v.currency) args.currency = v.currency;
  if (v.state) args.state = parseEnumString("state", v.state, DEPOSIT_COIN_STATES);
  if (v.depositIds) args.deposit_ids = toArray(v.depositIds);
  if (v.txids) args.txids = parseJsonStringArray("txids", v.txids);
  if (v.limit) args.limit = parseRangedInt("limit", toNumber(v.limit, "limit"), 1, 100);
  if (v.page) args.page = parsePositiveInt("page", toNumber(v.page, "page"));
  if (v.orderBy) args.order_by = v.orderBy;
  const result = await run("deposit_get_list", args);
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No deposits found");
    return;
  }
  printTable(items.map((o) => renameKey(o, "uuid", "deposit_id")));
}
async function cmdListKrw(run, v, json) {
  const args = {};
  if (v.state) args.state = parseEnumString("state", v.state, DEPOSIT_KRW_STATES);
  if (v.depositIds) args.deposit_ids = toArray(v.depositIds);
  if (v.txids) args.txids = parseJsonStringArray("txids", v.txids);
  if (v.limit) args.limit = parseRangedInt("limit", toNumber(v.limit, "limit"), 1, 100);
  if (v.page) args.page = parsePositiveInt("page", toNumber(v.page, "page"));
  if (v.orderBy) args.order_by = v.orderBy;
  const result = await run("deposit_get_list_krw", args);
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No KRW deposits found");
    return;
  }
  printTable(items.map((o) => renameKey(o, "uuid", "deposit_id")));
}
function renameKey(obj, from, to) {
  if (!(from in obj)) return obj;
  const out = {};
  for (const [k, val] of Object.entries(obj)) {
    out[k === from ? to : k] = val;
  }
  return out;
}
async function cmdKrw(run, v, json) {
  if (!v.amount || !v.twoFactorType) {
    errorLine("Error: --amount and --two-factor-type required.");
    errorLine("CAUTION: This will initiate a real KRW deposit request!");
    process.exitCode = 1;
    return;
  }
  const result = await run("deposit_krw", { amount: v.amount, two_factor_type: v.twoFactorType });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdGenerateAddress(run, v, json) {
  if (!v.currency || !v.netType) {
    errorLine("Error: --currency and --net-type required. Example: bithumb deposit generate-address --currency BTC --net-type BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("deposit_generate_address", { currency: v.currency, net_type: v.netType });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdAddresses(run, json) {
  const result = await run("deposit_get_addresses", {});
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No deposit addresses found");
    return;
  }
  printTable(items);
}
async function cmdAddress(run, v, json) {
  if (!v.currency || !v.netType) {
    errorLine("Error: --currency and --net-type required. Example: bithumb deposit address --currency BTC --net-type BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("deposit_get_address", { currency: v.currency, net_type: v.netType });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
export {
  handleDepositCommand
};
//# sourceMappingURL=deposit-RI6TZG3I.js.map