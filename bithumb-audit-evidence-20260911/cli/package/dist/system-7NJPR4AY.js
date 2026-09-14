#!/usr/bin/env node
import {
  parsePositiveInt,
  toNumber
} from "./chunk-YQV47CJP.js";
import {
  errorLine,
  outputLine,
  printJson,
  printKv,
  printTable
} from "./chunk-FYO6WLZI.js";

// src/commands/system.ts
async function handleSystemCommand(run, action, v, json) {
  switch (action) {
    case "diagnose":
      return cmdDiagnose(run, json);
    case "audit":
      return cmdAudit(run, {
        limit: parsePositiveInt("limit", toNumber(v.limit, "limit")),
        tool: v.tool,
        since: v.since,
        level: v.level,
        json
      });
    default:
      errorLine(`Unknown system command: ${action ?? "(none)"}. Run 'bithumb system --help' for usage.`);
      process.exitCode = 1;
  }
}
async function cmdDiagnose(run, json) {
  const result = await run("system_diagnose", {});
  const data = result.data ?? result;
  if (json) return printJson(data);
  printKv(data);
}
async function cmdAudit(run, opts) {
  const args = {};
  if (opts.limit !== void 0) args.limit = opts.limit;
  if (opts.tool !== void 0) args.tool = opts.tool;
  if (opts.since !== void 0) args.since = opts.since;
  if (opts.level !== void 0) args.level = opts.level;
  const result = await run("system_get_audit_log", args);
  const items = result.data;
  if (opts.json) return printJson(items);
  if (!items?.length) {
    outputLine("No audit entries found");
    return;
  }
  printTable(items.map((entry) => ({
    timestamp: entry["ts"],
    level: entry["level"],
    tool: entry["tool"],
    message: entry["message"],
    elapsed_ms: entry["elapsed"]
  })));
}
export {
  handleSystemCommand
};
//# sourceMappingURL=system-7NJPR4AY.js.map