#!/usr/bin/env node

// src/formatter.ts
var impl = {
  out: (msg) => process.stdout.write(msg),
  err: (msg) => process.stderr.write(msg)
};
function outputLine(message) {
  impl.out(message + "\n");
}
function errorLine(message) {
  impl.err(message + "\n");
}
function printJson(data) {
  outputLine(JSON.stringify(data, null, 2));
}
function printTable(rows) {
  if (rows.length === 0) {
    outputLine("No data");
    return;
  }
  const keys = Object.keys(rows[0]);
  const toStr = (v) => {
    if (v === null || v === void 0) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  const widths = keys.map(
    (k) => Math.max(k.length, ...rows.map((r) => toStr(r[k]).length))
  );
  const header = keys.map((k, i) => k.padEnd(widths[i])).join("  ");
  outputLine(header);
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  outputLine(separator);
  for (const row of rows) {
    const line = keys.map((k, i) => toStr(row[k]).padEnd(widths[i])).join("  ");
    outputLine(line);
  }
}
function printKv(obj, indent = 0) {
  const prefix = " ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      impl.out(`${prefix}${key}:
`);
      for (const item of value) {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          printKv(item, indent + 2);
        } else {
          impl.out(`${prefix}  ${String(item)}
`);
        }
      }
    } else if (value !== null && typeof value === "object") {
      impl.out(`${prefix}${key}:
`);
      printKv(value, indent + 2);
    } else {
      impl.out(`${prefix}${key}: ${String(value)}
`);
    }
  }
}

export {
  outputLine,
  errorLine,
  printJson,
  printTable,
  printKv
};
//# sourceMappingURL=chunk-FYO6WLZI.js.map