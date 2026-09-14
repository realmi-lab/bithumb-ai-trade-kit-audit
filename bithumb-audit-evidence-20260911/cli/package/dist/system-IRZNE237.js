#!/usr/bin/env node

// src/help/system.ts
var MODULE_HELP = `
Usage: bithumb system <command> [options]

Commands:
  diagnose                         Run connectivity, authentication, config, and module diagnostics
  audit                            View local trade audit log

Options:
  --json             Output as JSON
  --profile <name>   Config profile to use (default: "default")
  --verbose          Enable verbose logging

Examples:
  bithumb system diagnose
  bithumb system diagnose --profile trading
  bithumb system audit --limit 10

Notes:
  - Use 'diagnose' to verify API reachability, auth status, TOML config, and module status.
  - Use 'audit' to view local CLI/MCP trade audit log entries (reads ~/.bithumb/logs/).
  - Both commands run without API credentials (auth is reported but not required).
`;
var DIAGNOSE_HELP = `
Usage: bithumb system diagnose [options]

Run connectivity, authentication, config, and module diagnostics against the
Bithumb API. Useful as a first step when authenticated commands fail or when
verifying your credentials and configuration.

Options:
  --json             Output as JSON
  --profile <name>   Config profile to use (default: "default")
  --verbose          Enable verbose logging

Examples:
  bithumb system diagnose
  bithumb system diagnose --json
  bithumb system diagnose --profile trading

Notes:
  - Does not require API credentials to run, but reports auth status.
  - Output includes API reachability, auth validity, config OK, and module status.
`;
var AUDIT_HELP = `
Usage: bithumb system audit [options]

View the local trade audit log (records of CLI/MCP-issued tool calls).
Reads from \`~/.bithumb/logs/trade-YYYY-MM-DD.log\` over the last 7 days.
Does not require API credentials \u2014 purely local file access.

Required:
  (none)

Options:
  --limit <n>        Number of log entries to return (>=1, default: 20)
  --tool <name>      Filter by tool name
  --since <date>     Show entries since date (ISO format)
  --level <level>    Filter by log level (INFO, WARN, ERROR, DEBUG)

Examples:
  bithumb system audit --limit 10
  bithumb system audit --since 2026-05-01 --level ERROR
  bithumb system audit --tool account_get_assets --json
`;
var ACTION_HELP = {
  diagnose: DIAGNOSE_HELP,
  audit: AUDIT_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=system-IRZNE237.js.map