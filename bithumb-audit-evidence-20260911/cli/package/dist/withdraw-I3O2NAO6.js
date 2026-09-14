#!/usr/bin/env node
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

// src/commands/withdraw.ts
var WITHDRAW_STATES = ["PROCESSING", "DONE", "CANCELLED"];
async function handleWithdrawCommand(run, action, v, json) {
  switch (action) {
    case "chance":
      return cmdChance(run, v, json);
    case "get":
      return cmdGet(run, v, json);
    case "list":
      return cmdList(run, v, json);
    case "list-krw":
      return cmdListKrw(run, v, json);
    case "coin":
      return cmdCoin(run, v, json);
    case "krw":
      return cmdKrw(run, v, json);
    case "cancel":
      return cmdCancel(run, v, json);
    case "addresses":
      return cmdAddresses(run, json);
    default:
      errorLine(`Unknown withdraw command: ${action}. Run 'bithumb withdraw --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdChance(run, v, json) {
  if (!v.currency || !v.netType) {
    errorLine("Error: --currency and --net-type required. Example: bithumb withdraw chance --currency BTC --net-type BTC");
    process.exitCode = 1;
    return;
  }
  const result = await run("withdraw_get_chance", { currency: v.currency, net_type: v.netType });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdGet(run, v, json) {
  if (!v.currency) {
    errorLine("Error: --currency required. Example: bithumb withdraw get --currency BTC --withdrawal-id abc-123");
    process.exitCode = 1;
    return;
  }
  const args = { currency: v.currency };
  if (v.withdrawalId) args.withdrawal_id = v.withdrawalId;
  if (v.txid) args.txid = v.txid;
  const result = await run("withdraw_get", args);
  const data = result.data;
  if (json) return printJson(data);
  printKv(renameKey(data, "uuid", "withdrawal_id"));
}
async function cmdList(run, v, json) {
  const args = {};
  if (v.currency) args.currency = v.currency;
  if (v.state) args.state = parseEnumString("state", v.state, WITHDRAW_STATES);
  if (v.withdrawalIds) args.withdrawal_ids = toArray(v.withdrawalIds);
  if (v.txids) args.txids = parseJsonStringArray("txids", v.txids);
  if (v.limit) args.limit = parseRangedInt("limit", toNumber(v.limit, "limit"), 1, 100);
  if (v.page) args.page = parsePositiveInt("page", toNumber(v.page, "page"));
  if (v.orderBy) args.order_by = v.orderBy;
  const result = await run("withdraw_get_list", args);
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No withdrawals found");
    return;
  }
  printTable(items.map((o) => renameKey(o, "uuid", "withdrawal_id")));
}
async function cmdListKrw(run, v, json) {
  const args = {};
  if (v.state) args.state = parseEnumString("state", v.state, WITHDRAW_STATES);
  if (v.withdrawalIds) args.withdrawal_ids = toArray(v.withdrawalIds);
  if (v.txids) args.txids = parseJsonStringArray("txids", v.txids);
  if (v.limit) args.limit = parseRangedInt("limit", toNumber(v.limit, "limit"), 1, 100);
  if (v.page) args.page = parsePositiveInt("page", toNumber(v.page, "page"));
  if (v.orderBy) args.order_by = v.orderBy;
  const result = await run("withdraw_get_list_krw", args);
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No KRW withdrawals found");
    return;
  }
  printTable(items.map((o) => renameKey(o, "uuid", "withdrawal_id")));
}
function renameKey(obj, from, to) {
  if (!(from in obj)) return obj;
  const out = {};
  for (const [k, val] of Object.entries(obj)) {
    out[k === from ? to : k] = val;
  }
  return out;
}
async function cmdCoin(run, v, json) {
  if (!v.currency || !v.netType || !v.amount || !v.address) {
    errorLine("Error: --currency, --net-type, --amount, --address required.");
    errorLine("CAUTION: This will initiate a real cryptocurrency withdrawal!");
    process.exitCode = 1;
    return;
  }
  const args = {
    currency: v.currency,
    net_type: v.netType,
    amount: v.amount,
    address: v.address
  };
  if (v.secondaryAddress) args.secondary_address = v.secondaryAddress;
  if (v.exchangeName) args.exchange_name = v.exchangeName;
  if (v.receiverType) args.receiver_type = v.receiverType;
  if (v.receiverKoName) args.receiver_ko_name = v.receiverKoName;
  if (v.receiverEnName) args.receiver_en_name = v.receiverEnName;
  if (v.receiverCorpKoName) args.receiver_corp_ko_name = v.receiverCorpKoName;
  if (v.receiverCorpEnName) args.receiver_corp_en_name = v.receiverCorpEnName;
  const result = await run("withdraw_coin", args);
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdKrw(run, v, json) {
  if (!v.amount || !v.twoFactorType) {
    errorLine("Error: --amount and --two-factor-type required.");
    errorLine("CAUTION: This will initiate a real KRW withdrawal!");
    process.exitCode = 1;
    return;
  }
  const result = await run("withdraw_krw", { amount: v.amount, two_factor_type: v.twoFactorType });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdCancel(run, v, json) {
  if (!v.withdrawalId) {
    errorLine("Error: --withdrawal-id required. Example: bithumb withdraw cancel --withdrawal-id abc-123");
    process.exitCode = 1;
    return;
  }
  const result = await run("withdraw_cancel_coin", { withdrawal_id: v.withdrawalId });
  const data = result.data;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdAddresses(run, json) {
  const result = await run("withdraw_get_addresses", {});
  const items = result.data;
  if (json) return printJson(items);
  if (!items?.length) {
    outputLine("No withdrawal addresses found");
    return;
  }
  printTable(items);
}
export {
  handleWithdrawCommand
};
//# sourceMappingURL=withdraw-I3O2NAO6.js.map