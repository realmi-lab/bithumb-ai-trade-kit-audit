#!/usr/bin/env node
import {
  ConfigError,
  configFilePath,
  readFullConfig,
  resolveEffectiveProfileName,
  validateProfileName,
  validateTimeoutMs,
  writeFullConfig
} from "./chunk-Y64A2CTR.js";
import {
  errorLine,
  outputLine,
  printJson,
  printKv,
  printTable
} from "./chunk-FYO6WLZI.js";

// src/commands/config.ts
import { existsSync } from "fs";
import { createInterface } from "readline";
function resolvePrompter(deps) {
  if (deps?.prompt) return { prompt: deps.prompt, close: () => {
  } };
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const lines = rl[Symbol.asyncIterator]();
  const prompt = async (question) => {
    process.stdout.write(question);
    const { value, done } = await lines.next();
    if (done) {
      throw new ConfigError(
        "Unexpected end of input while prompting.",
        "Provide a value for every prompt, or run the command interactively."
      );
    }
    return value;
  };
  return { prompt, close: () => rl.close() };
}
function handleConfigCommand(action, rest, v, deps) {
  const json = v.json ?? false;
  switch (action) {
    case "show":
      return cmdConfigShow(json, v.profile);
    case "init":
      return cmdConfigInit(deps);
    case "set":
      if (rest[0] === void 0) {
        return cmdConfigSetWizard(v.profile, deps);
      }
      return cmdConfigSet(rest[0], rest[1], v.profile);
    case "add-profile":
      return cmdConfigAddProfile(rest, deps);
    case "list-profiles":
      return cmdConfigListProfiles(json);
    case "use":
      return cmdConfigUse(rest[0]);
    case "path":
      outputLine(configFilePath());
      return;
    default:
      if (!action) {
        return cmdConfigShow(json, v.profile);
      }
      errorLine(`Unknown config command: ${action}. Available: show, init, set, add-profile, list-profiles, use, path`);
      process.exitCode = 1;
  }
}
function reportWizardError(err) {
  if (err instanceof ConfigError) {
    errorLine(err.message);
    process.exitCode = 1;
    return true;
  }
  return false;
}
function validateProfileNameOrReport(name) {
  try {
    validateProfileName(name);
    return true;
  } catch (err) {
    errorLine(err instanceof ConfigError ? err.message : String(err));
    process.exitCode = 1;
    return false;
  }
}
function readOnlyDisplay(p) {
  if (p.read_only === void 0) return "(not set \u2192 writes allowed)";
  return p.read_only ? "true (read-only \u2014 writes blocked)" : "false (writes allowed)";
}
function maskedProfile(p) {
  const masked = { ...p };
  if (masked.access_key) masked.access_key = `${masked.access_key.slice(0, 8)}...`;
  if (masked.secret_key) masked.secret_key = "***";
  return masked;
}
function maskedProfiles(profiles) {
  return Object.fromEntries(Object.entries(profiles).map(([name, p]) => [name, maskedProfile(p)]));
}
function profileKv(p) {
  return {
    access_key: p.access_key ? `${p.access_key.slice(0, 8)}...` : "(not set)",
    secret_key: p.secret_key ? "***" : "(not set)",
    ...p.base_url ? { base_url: p.base_url } : {},
    ...p.timeout_ms ? { timeout_ms: p.timeout_ms } : {},
    read_only: readOnlyDisplay(p)
  };
}
function readOnlyNotice(config, profile) {
  if (profile?.read_only !== true) return void 0;
  const writeCapable = Object.entries(config.profiles).filter(([, p]) => p.read_only !== true).map(([name]) => name);
  return {
    blocked_for_writes: true,
    write_capable_profiles: writeCapable,
    guidance: "Effective profile is read-only \u2014 real orders, withdrawals, and deposits are blocked. Skip write-preflight lookups (order-chance, withdraw chance, wallet-status, withdraw addresses, fee-inout); they prepare a write that cannot run. List the write-capable profiles to the user and let them pick one with --profile <name>. Do not auto-select a profile or disable read-only on the user's behalf."
  };
}
function cmdConfigShow(json, profileName) {
  const config = readFullConfig();
  const effective = resolveEffectiveProfileName(config, profileName);
  if (profileName !== void 0) {
    const p = config.profiles[profileName];
    if (json) {
      if (!p) {
        process.exitCode = 1;
        return printJson({ profile: profileName, settings: null, error: "profile_not_found" });
      }
      const notice = readOnlyNotice(config, p);
      return printJson({
        profile: profileName,
        settings: maskedProfile(p),
        ...notice ? { read_only_notice: notice } : {}
      });
    }
    outputLine(`Config file: ${configFilePath()}`);
    if (!p) {
      errorLine(`Profile '${profileName}' not found. Run 'bithumb config list-profiles' to see available profiles.`);
      process.exitCode = 1;
      return;
    }
    outputLine(`Profile: ${profileName} (effective)`);
    outputLine("");
    outputLine(`[${profileName}]`);
    printKv(profileKv(p));
    return;
  }
  if (json) {
    const notice = readOnlyNotice(config, config.profiles[effective]);
    return printJson({
      ...config,
      profiles: maskedProfiles(config.profiles),
      effective_profile: effective,
      ...notice ? { read_only_notice: notice } : {}
    });
  }
  outputLine(`Config file: ${configFilePath()}`);
  if (config.default_profile) {
    outputLine(`Default profile: ${config.default_profile}`);
  }
  outputLine(`Effective profile: ${effective}`);
  outputLine("");
  const profileNames = Object.keys(config.profiles);
  if (profileNames.length === 0) {
    outputLine("No profiles configured. Run 'bithumb config init' to create one.");
    return;
  }
  for (const name of profileNames) {
    const p = config.profiles[name];
    outputLine(`[${name}]${name === effective ? " \u2190 effective" : ""}`);
    printKv(profileKv(p));
    outputLine("");
  }
}
async function cmdConfigInit(deps) {
  const path = configFilePath();
  if (existsSync(path)) {
    outputLine(`Config file already exists: ${path}`);
    outputLine("Use 'bithumb config add-profile <name>' to add a new profile, or");
    outputLine("'bithumb config set' to update the current profile.");
    return;
  }
  const { prompt, close } = resolvePrompter(deps);
  try {
    const profileInput = await prompt("Profile name (default): ");
    const profileName = profileInput.trim() || "default";
    if (!validateProfileNameOrReport(profileName)) return;
    const profile = await runProfileWizard(prompt, {});
    const config = {
      default_profile: profileName,
      profiles: { [profileName]: profile }
    };
    writeFullConfig(config);
    outputLine(`
\u2713 Config file created: ${path}`);
  } catch (err) {
    if (!reportWizardError(err)) throw err;
  } finally {
    close();
  }
}
function maskHint(value, reveal = false) {
  if (!value) return "";
  return reveal ? `${value.slice(0, 8)}...` : "***";
}
async function runProfileWizard(prompt, existing) {
  const accessHint = maskHint(existing.access_key, true);
  const access = (await prompt(`Access key${accessHint ? ` [${accessHint}]` : ""}: `)).trim();
  const secretHint = maskHint(existing.secret_key);
  const secret = (await prompt(`Secret key${secretHint ? ` [${secretHint}]` : ""}: `)).trim();
  const roHint = existing.read_only === void 0 ? "" : ` [${existing.read_only ? "y" : "N"}]`;
  const ro = (await prompt(`Read-only? (y/N)${roHint}: `)).trim();
  const timeoutHint = existing.timeout_ms === void 0 ? "" : ` [${existing.timeout_ms}]`;
  const timeout = (await prompt(`Timeout (ms)${timeoutHint}: `)).trim();
  const next = { ...existing };
  if (access !== "") next.access_key = access;
  if (secret !== "") next.secret_key = secret;
  if (ro !== "") next.read_only = /^y(es)?$/i.test(ro);
  if (timeout !== "") next.timeout_ms = validateTimeoutMs(Number(timeout));
  return next;
}
async function cmdConfigSetWizard(profileName, deps) {
  const config = readFullConfig();
  const name = profileName ?? config.default_profile ?? "default";
  if (!config.profiles[name]) {
    if (Object.keys(config.profiles).length === 0) {
      errorLine("No profiles configured. Run 'bithumb config init' to create your first profile.");
    } else {
      errorLine(`Profile '${name}' does not exist. Run 'bithumb config add-profile ${name}' to create it.`);
    }
    process.exitCode = 1;
    return;
  }
  const { prompt, close } = resolvePrompter(deps);
  try {
    config.profiles[name] = await runProfileWizard(prompt, config.profiles[name]);
    writeFullConfig(config);
    outputLine(`Updated profile '${name}'`);
  } catch (err) {
    if (!reportWizardError(err)) throw err;
  } finally {
    close();
  }
}
function cmdConfigSet(key, value, profileName) {
  if (!key || value === void 0) {
    errorLine("Usage: bithumb config set <key> <value> [--profile <name>]");
    errorLine("Keys: access_key, secret_key, timeout_ms, read_only");
    process.exitCode = 1;
    return;
  }
  const validKeys = /* @__PURE__ */ new Set(["access_key", "secret_key", "timeout_ms", "read_only"]);
  if (!validKeys.has(key)) {
    errorLine(`Invalid key: ${key}. Valid keys: ${[...validKeys].join(", ")}`);
    process.exitCode = 1;
    return;
  }
  let parsed = value;
  if (key === "timeout_ms") {
    try {
      parsed = validateTimeoutMs(Number(value));
    } catch (err) {
      errorLine(err instanceof ConfigError ? err.message : String(err));
      process.exitCode = 1;
      return;
    }
  } else if (key === "read_only") {
    if (value !== "true" && value !== "false") {
      errorLine(`Invalid read_only: ${value}. Use 'true' or 'false'.`);
      process.exitCode = 1;
      return;
    }
    parsed = value === "true";
  }
  const config = readFullConfig();
  const name = profileName ?? config.default_profile ?? "default";
  if (!config.profiles[name]) {
    config.profiles[name] = {};
  }
  config.profiles[name][key] = parsed;
  writeFullConfig(config);
  outputLine(`Set ${name}.${key}`);
}
async function cmdConfigAddProfile(rest, deps) {
  const { prompt, close } = resolvePrompter(deps);
  try {
    const name = (rest[0] ?? await prompt("Profile name: ")).trim();
    if (!validateProfileNameOrReport(name)) return;
    const config = readFullConfig();
    if (config.profiles[name]) {
      errorLine(`Profile '${name}' already exists.`);
      process.exitCode = 1;
      return;
    }
    const isFirstProfile = Object.keys(config.profiles).length === 0;
    config.profiles[name] = await runProfileWizard(prompt, {});
    if (isFirstProfile && !config.default_profile) {
      config.default_profile = name;
    }
    writeFullConfig(config);
    outputLine(`Profile '${name}' added.`);
  } catch (err) {
    if (!reportWizardError(err)) throw err;
  } finally {
    close();
  }
}
function cmdConfigListProfiles(json) {
  const config = readFullConfig();
  const profiles = Object.entries(config.profiles).map(([name, p]) => ({
    name,
    default: name === (config.default_profile ?? "default") ? "*" : "",
    has_credentials: p.access_key && p.secret_key ? "yes" : "no"
  }));
  if (json) return printJson(profiles);
  if (profiles.length === 0) {
    outputLine("No profiles configured.");
    return;
  }
  printTable(profiles);
}
function cmdConfigUse(profileName) {
  if (!profileName) {
    errorLine("Usage: bithumb config use <profile-name>");
    process.exitCode = 1;
    return;
  }
  const config = readFullConfig();
  if (!config.profiles[profileName]) {
    errorLine(`Profile '${profileName}' not found. Run 'bithumb config list-profiles' to see available profiles.`);
    process.exitCode = 1;
    return;
  }
  config.default_profile = profileName;
  writeFullConfig(config);
  outputLine(`Default profile set to '${profileName}'`);
}
export {
  handleConfigCommand
};
//# sourceMappingURL=config-FAPUDUEP.js.map