#!/usr/bin/env node

// src/parser.ts
import { parseArgs } from "util";
var CliUsageError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
};
var CLI_OPTIONS = {
  profile: { type: "string" },
  json: { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
  version: { type: "boolean", short: "v", default: false },
  verbose: { type: "boolean", default: false },
  client: { type: "string" },
  modules: { type: "string" },
  unit: { type: "string" },
  count: { type: "string" },
  to: { type: "string" },
  "is-details": { type: "boolean", default: false },
  market: { type: "string" },
  "client-order-id": { type: "string" },
  side: { type: "string" },
  "ord-type": { type: "string" },
  "order-type": { type: "string" },
  price: { type: "string" },
  volume: { type: "string" },
  state: { type: "string" },
  states: { type: "string" },
  "order-id": { type: "string" },
  "order-ids": { type: "string" },
  "client-order-ids": { type: "string" },
  "order-by": { type: "string" },
  cursor: { type: "string" },
  "days-ago": { type: "string" },
  "converting-price-unit": { type: "string" },
  page: { type: "string" },
  limit: { type: "string" },
  tool: { type: "string" },
  since: { type: "string" },
  level: { type: "string" },
  currency: { type: "string" },
  "net-type": { type: "string" },
  address: { type: "string" },
  "secondary-address": { type: "string" },
  "exchange-name": { type: "string" },
  "receiver-type": { type: "string" },
  "receiver-ko-name": { type: "string" },
  "receiver-en-name": { type: "string" },
  "receiver-corp-ko-name": { type: "string" },
  "receiver-corp-en-name": { type: "string" },
  amount: { type: "string" },
  "two-factor-type": { type: "string" },
  txids: { type: "string" },
  txid: { type: "string" },
  "withdrawal-id": { type: "string" },
  "withdrawal-ids": { type: "string" },
  "deposit-id": { type: "string" },
  "deposit-ids": { type: "string" },
  duration: { type: "string" },
  frequency: { type: "string" },
  "algo-order-id": { type: "string" },
  "next-key": { type: "string" },
  file: { type: "string" }
};
var KNOWN_LONG_OPTIONS = new Set(Object.keys(CLI_OPTIONS));
var KNOWN_SHORT_OPTIONS = new Set(
  Object.entries(CLI_OPTIONS).filter(([, spec]) => spec.short !== void 0).map(([name]) => name)
);
function parseCli(argv) {
  const parsed = parseArgs({
    args: argv,
    options: CLI_OPTIONS,
    allowPositionals: true,
    strict: false,
    tokens: true
  });
  const { values: raw, positionals, tokens } = parsed;
  const shortOptionCountByIndex = /* @__PURE__ */ new Map();
  for (const token of tokens) {
    if (token.kind === "option" && token.rawName.startsWith("-") && !token.rawName.startsWith("--")) {
      shortOptionCountByIndex.set(token.index, (shortOptionCountByIndex.get(token.index) ?? 0) + 1);
    }
  }
  for (const token of tokens) {
    if (token.kind !== "option") continue;
    if (token.rawName.startsWith("--")) {
      if (!KNOWN_LONG_OPTIONS.has(token.name)) {
        throw new CliUsageError(`unknown option: '${argv[token.index]}'`);
      }
    } else {
      if ((shortOptionCountByIndex.get(token.index) ?? 0) > 1 || !KNOWN_SHORT_OPTIONS.has(token.name)) {
        throw new CliUsageError(`unknown option: '${argv[token.index]}'`);
      }
    }
  }
  for (const [key, spec] of Object.entries(CLI_OPTIONS)) {
    if (spec.type === "string" && raw[key] === true) {
      throw new CliUsageError(`option '--${key}' requires a value`);
    }
  }
  const values = {
    profile: raw.profile,
    json: raw.json,
    help: raw.help,
    version: raw.version,
    verbose: raw.verbose,
    client: raw.client,
    modules: raw.modules,
    unit: raw.unit,
    count: raw.count,
    to: raw.to,
    isDetails: raw["is-details"],
    market: raw.market,
    clientOrderId: raw["client-order-id"],
    side: raw.side,
    // Canonical: --order-type. Deprecated alias: --ord-type. Prefer canonical.
    ordType: raw["order-type"] ?? raw["ord-type"],
    ordTypeFromDeprecatedAlias: raw["order-type"] === void 0 && raw["ord-type"] !== void 0,
    ordTypeConflict: raw["order-type"] !== void 0 && raw["ord-type"] !== void 0,
    price: raw.price,
    volume: raw.volume,
    state: raw.state,
    states: raw.states,
    orderId: raw["order-id"],
    orderIds: raw["order-ids"],
    clientOrderIds: raw["client-order-ids"],
    orderBy: raw["order-by"],
    cursor: raw.cursor,
    daysAgo: raw["days-ago"],
    convertingPriceUnit: raw["converting-price-unit"],
    page: raw.page,
    limit: raw.limit,
    tool: raw.tool,
    since: raw.since,
    level: raw.level,
    currency: raw.currency,
    netType: raw["net-type"],
    address: raw.address,
    secondaryAddress: raw["secondary-address"],
    exchangeName: raw["exchange-name"],
    receiverType: raw["receiver-type"],
    receiverKoName: raw["receiver-ko-name"],
    receiverEnName: raw["receiver-en-name"],
    receiverCorpKoName: raw["receiver-corp-ko-name"],
    receiverCorpEnName: raw["receiver-corp-en-name"],
    amount: raw.amount,
    twoFactorType: raw["two-factor-type"],
    txids: raw.txids,
    txid: raw.txid,
    withdrawalId: raw["withdrawal-id"],
    withdrawalIds: raw["withdrawal-ids"],
    depositId: raw["deposit-id"],
    depositIds: raw["deposit-ids"],
    duration: raw.duration,
    frequency: raw.frequency,
    algoOrderId: raw["algo-order-id"],
    nextKey: raw["next-key"],
    file: raw.file
  };
  return { values, positionals };
}
function toArray(value) {
  if (!value) return void 0;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}
function parseJsonStringArray(flag, value) {
  if (!value) return void 0;
  const hint = `Invalid --${flag}: must be a JSON array of strings, e.g. --${flag} '["txid1","txid2"]'.`;
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new CliUsageError(hint);
  }
  if (!Array.isArray(parsed) || !parsed.every((s) => typeof s === "string")) {
    throw new CliUsageError(hint);
  }
  return parsed.map((s) => s.trim()).filter(Boolean);
}
function toNumber(value, flag) {
  if (value === void 0 || value === null) return void 0;
  const n = Number(value);
  if (Number.isNaN(n)) {
    if (flag !== void 0) {
      throw new CliUsageError(
        `Invalid --${flag}: must be a number. Got '${value}'.`
      );
    }
    return void 0;
  }
  return n;
}
var TIMEZONE_OFFSET_PATTERN = /(?:Z|[+\-]\d{2}:?\d{2})$/;
function parseKstDatetime(value) {
  if (value === void 0 || value === "") return value;
  if (TIMEZONE_OFFSET_PATTERN.test(value)) {
    throw new CliUsageError(
      "Invalid --to: timezone offset is not supported. Bithumb API requires KST naive datetime (no offset). Use YYYY-MM-DDTHH:MM:SS, e.g. 2026-01-01T00:00:00"
    );
  }
  return value;
}
function parseKstTimeOfDay(value) {
  if (value === void 0 || value === "") return value;
  if (value.includes("T") || value.includes("-")) {
    throw new CliUsageError(
      "Invalid --to: trades expects time-of-day only, not a date. Use HHmmss or HH:mm:ss (00:00:00\u201323:59:59), e.g. 230000 or 23:00:00. For past days use --days-ago (1\u20137)."
    );
  }
  if (TIMEZONE_OFFSET_PATTERN.test(value)) {
    throw new CliUsageError(
      "Invalid --to: timezone offset is not supported. Use HHmmss or HH:mm:ss (KST, no offset), e.g. 230000 or 23:00:00."
    );
  }
  return value;
}
function parseRangedInt(flag, value, min, max) {
  if (value === void 0) return void 0;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new CliUsageError(
      `Invalid --${flag}: must be between ${min} and ${max}. Got ${value}.`
    );
  }
  return value;
}
function parsePositiveInt(flag, value, min = 1) {
  if (value === void 0) return void 0;
  if (!Number.isInteger(value) || value < min) {
    throw new CliUsageError(
      `Invalid --${flag}: must be an integer >= ${min}. Got ${value}.`
    );
  }
  return value;
}
function parseEnumInt(flag, value, allowed) {
  if (value === void 0) return void 0;
  if (!allowed.includes(value)) {
    throw new CliUsageError(
      `Invalid --${flag}: must be one of ${allowed.join(", ")}. Got ${value}.`
    );
  }
  return value;
}
function parseEnumString(flag, value, allowed) {
  if (value === void 0) return void 0;
  if (!allowed.includes(value)) {
    throw new CliUsageError(
      `Invalid --${flag}: must be one of ${allowed.join(", ")}. Got '${value}'.`
    );
  }
  return value;
}

export {
  CliUsageError,
  parseCli,
  toArray,
  parseJsonStringArray,
  toNumber,
  parseKstDatetime,
  parseKstTimeOfDay,
  parseRangedInt,
  parsePositiveInt,
  parseEnumInt,
  parseEnumString
};
//# sourceMappingURL=chunk-YQV47CJP.js.map