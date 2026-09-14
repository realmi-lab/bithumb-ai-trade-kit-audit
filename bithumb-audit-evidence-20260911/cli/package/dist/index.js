#!/usr/bin/env node
import {
  BithumbRestClient,
  TradeLogger,
  checkForUpdates,
  createToolRunner,
  loadConfig
} from "./chunk-Y64A2CTR.js";
import {
  CliUsageError,
  parseCli
} from "./chunk-YQV47CJP.js";
import {
  errorLine,
  outputLine
} from "./chunk-FYO6WLZI.js";

// src/index.ts
import { realpathSync } from "fs";
import { pathToFileURL } from "url";

// src/constants.ts
var CLI_VERSION = "0.8.5";

// src/help/index.ts
var GLOBAL_HELP = `
bithumb v${CLI_VERSION} \u2014 Bithumb Trade CLI

Usage: bithumb <module> <command> [options]

Modules:
  market          Market data (ticker, orderbook, candles, trades)
  account         Account assets, wallet status, API keys
  trade           Order management (list, place, cancel, batch)
  twap            TWAP (Time-Weighted Average Price) orders
  withdraw        Cryptocurrency and KRW withdrawals
  deposit         Cryptocurrency and KRW deposits

Utility:
  config          Manage profiles and CLI configuration
  system          Diagnostics and local audit log (no auth required)

Global Options:
  --profile <name>   Config profile to use (default: "default")
  --json             Output as JSON
  --verbose          Enable verbose logging
  -h, --help         Show help
  -v, --version      Show version

Credentials are read from env vars (BITHUMB_ACCESS_KEY / BITHUMB_SECRET_KEY) or a
config.toml profile. Run 'bithumb config init' to create one.

Run 'bithumb <module> --help' for module-specific commands.
`;
async function loadModule(module) {
  switch (module) {
    case "market":
      return await import("./market-PDAZLC7N.js");
    case "account":
      return await import("./account-AKQYVHGA.js");
    case "trade":
      return await import("./trade-R2ZJDBX7.js");
    case "twap":
      return await import("./twap-GRDKSXSP.js");
    case "withdraw":
      return await import("./withdraw-3FHOFUMC.js");
    case "deposit":
      return await import("./deposit-NUQHYR2R.js");
    case "system":
      return await import("./system-IRZNE237.js");
    case "config":
      return await import("./config-UCV76BDH.js");
    default:
      return null;
  }
}
async function printHelp(positionals) {
  const module = positionals[0];
  const loaded = module ? await loadModule(module) : null;
  if (loaded === null) {
    outputLine(GLOBAL_HELP.trim());
    return;
  }
  const action = positionals[1];
  if (action && loaded.ACTION_HELP && action in loaded.ACTION_HELP) {
    const helpText = loaded.ACTION_HELP[action].trim();
    const hint = "(\u{1F4A1} Run 'bithumb --help' for a list of global options.)";
    const withHint = helpText.replace(/\nExamples:/, `
${hint}

Examples:`);
    outputLine(withHint);
    return;
  }
  outputLine(loaded.MODULE_HELP.trim());
}

// src/index.ts
function wrapRunnerWithLogger(baseRunner, logger) {
  return async (toolName, args) => {
    const start = Date.now();
    try {
      const result = await baseRunner(toolName, args);
      logger.logTool("info", toolName, args, { status: "ok" }, Date.now() - start);
      return result;
    } catch (error) {
      logger.logTool("error", toolName, args, error, Date.now() - start);
      throw error;
    }
  };
}
async function main() {
  checkForUpdates("@bithumb-official/bithumb-cli", CLI_VERSION);
  let parsed;
  try {
    parsed = parseCli(process.argv.slice(2));
  } catch (err) {
    if (err instanceof CliUsageError) {
      errorLine(`Error: ${err.message}. Run 'bithumb --help' for usage.`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  const { values: v, positionals } = parsed;
  if (v.version) {
    outputLine(CLI_VERSION);
    return;
  }
  if (v.help || positionals.length === 0) {
    await printHelp(positionals);
    return;
  }
  const [module, action, ...rest] = positionals;
  const json = v.json ?? false;
  if (module === "config") {
    const { handleConfigCommand } = await import("./config-FAPUDUEP.js");
    return handleConfigCommand(action, rest, v);
  }
  const config = loadConfig({
    modules: v.modules,
    verbose: v.verbose,
    profile: v.profile,
    clientType: "cli"
  });
  const client = new BithumbRestClient(config);
  const baseRunner = createToolRunner(client, config);
  const logger = new TradeLogger({
    minLevel: v.verbose ? "debug" : "info",
    emitToStderr: v.verbose ?? false,
    verbose: v.verbose ?? false
  });
  const run = wrapRunnerWithLogger(baseRunner, logger);
  if (module === "system") {
    try {
      const { handleSystemCommand } = await import("./system-7NJPR4AY.js");
      return await handleSystemCommand(run, action, v, json);
    } catch (err) {
      if (err instanceof CliUsageError) {
        errorLine(`Error: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      throw err;
    }
  }
  const privateModules = /* @__PURE__ */ new Set(["account", "trade", "twap", "withdraw", "deposit"]);
  if (privateModules.has(module) && !config.hasAuth) {
    errorLine(
      "Error: API credentials required. Set BITHUMB_ACCESS_KEY/BITHUMB_SECRET_KEY env vars or run 'bithumb config init'."
    );
    process.exitCode = 1;
    return;
  }
  try {
    if (module === "market") {
      const { handleMarketCommand } = await import("./market-QAE3RKKM.js");
      return await handleMarketCommand(run, action, rest, v, json);
    }
    if (module === "account") {
      const { handleAccountCommand } = await import("./account-QBX2YIAU.js");
      return await handleAccountCommand(run, action, v, json);
    }
    if (module === "trade") {
      const { handleTradeCommand } = await import("./trade-XUYIIU4K.js");
      return await handleTradeCommand(run, action, v, json);
    }
    if (module === "twap") {
      const { handleTwapCommand } = await import("./twap-OJCQ2N33.js");
      return await handleTwapCommand(run, action, v, json);
    }
    if (module === "withdraw") {
      const { handleWithdrawCommand } = await import("./withdraw-I3O2NAO6.js");
      return await handleWithdrawCommand(run, action, v, json);
    }
    if (module === "deposit") {
      const { handleDepositCommand } = await import("./deposit-RI6TZG3I.js");
      return await handleDepositCommand(run, action, v, json);
    }
  } catch (err) {
    if (err instanceof CliUsageError) {
      errorLine(`Error: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  errorLine(`Unknown command: ${module}. Run 'bithumb --help' for usage.`);
  process.exitCode = 1;
}
function isDirectInvocation() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return import.meta.url === pathToFileURL(entry).href;
  }
}
if (isDirectInvocation()) {
  main().catch((err) => {
    errorLine(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}
export {
  main
};
//# sourceMappingURL=index.js.map