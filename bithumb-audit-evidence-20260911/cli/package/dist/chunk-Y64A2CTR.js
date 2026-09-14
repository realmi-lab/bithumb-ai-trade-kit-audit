#!/usr/bin/env node

// ../core/dist/index.js
import { createHash, createHmac, randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { readFileSync, writeFileSync, mkdirSync, existsSync as existsSync2, chmodSync } from "fs";
import { join as join2, dirname } from "path";
import { homedir as homedir2 } from "os";

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1; i <= line + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError = class extends Error {
  line;
  column;
  codeblock;
  constructor(message, options) {
    const [line, column] = getLineColFromPtr(options.toml, options.ptr);
    const codeblock = makeCodeBlock(options.toml, line, column);
    super(`Invalid TOML document: ${message}

${codeblock}`, options);
    this.line = line;
    this.column = column;
    this.codeblock = codeblock;
  }
};

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/util.js
function isEscaped(str, ptr) {
  let i = 0;
  while (str[ptr - ++i] === "\\")
    ;
  return --i && i % 2;
}
function indexOfNewline(str, start = 0, end = str.length) {
  let idx = str.indexOf("\n", start);
  if (str[idx - 1] === "\r")
    idx--;
  return idx <= end ? idx : -1;
}
function skipComment(str, ptr) {
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "\n")
      return i;
    if (c === "\r" && str[i + 1] === "\n")
      return i + 1;
    if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in comments", {
        toml: str,
        ptr
      });
    }
  }
  return str.length;
}
function skipVoid(str, ptr, banNewLines, banComments) {
  let c;
  while (1) {
    while ((c = str[ptr]) === " " || c === "	" || !banNewLines && (c === "\n" || c === "\r" && str[ptr + 1] === "\n"))
      ptr++;
    if (banComments || c !== "#")
      break;
    ptr = skipComment(str, ptr);
  }
  return ptr;
}
function skipUntil(str, ptr, sep, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "#") {
      i = indexOfNewline(str, i);
    } else if (c === sep) {
      return i + 1;
    } else if (c === end || banNewLines && (c === "\n" || c === "\r" && str[i + 1] === "\n")) {
      return i;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: str,
    ptr
  });
}
function getStringEnd(str, seek) {
  let first = str[seek];
  let target = first === str[seek + 1] && str[seek + 1] === str[seek + 2] ? str.slice(seek, seek + 3) : first;
  seek += target.length - 1;
  do
    seek = str.indexOf(target, ++seek);
  while (seek > -1 && first !== "'" && isEscaped(str, seek));
  if (seek > -1) {
    seek += target.length;
    if (target.length > 1) {
      if (str[seek] === first)
        seek++;
      if (str[seek] === first)
        seek++;
    }
  }
  return seek;
}

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/date.js
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class _TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    if (typeof date === "string") {
      let match = date.match(DATE_TIME_RE);
      if (match) {
        if (!match[1]) {
          hasDate = false;
          date = `0000-01-01T${date}`;
        }
        hasTime = !!match[2];
        hasTime && date[10] === " " && (date = date.replace(" ", "T"));
        if (match[2] && +match[2] > 23) {
          date = "";
        } else {
          offset = match[3] || null;
          date = date.toUpperCase();
          if (!offset && hasTime)
            date += "Z";
        }
      } else {
        date = "";
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 6e4);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new _TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
};

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/primitive.js
var INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var LEADING_ZERO = /^[+-]?0[0-9_]/;
var ESCAPE_REGEX = /^[0-9a-f]{2,8}$/i;
var ESC_MAP = {
  b: "\b",
  t: "	",
  n: "\n",
  f: "\f",
  r: "\r",
  e: "\x1B",
  '"': '"',
  "\\": "\\"
};
function parseString(str, ptr = 0, endPtr = str.length) {
  let isLiteral = str[ptr] === "'";
  let isMultiline = str[ptr++] === str[ptr] && str[ptr] === str[ptr + 1];
  if (isMultiline) {
    endPtr -= 2;
    if (str[ptr += 2] === "\r")
      ptr++;
    if (str[ptr] === "\n")
      ptr++;
  }
  let tmp = 0;
  let isEscape;
  let parsed = "";
  let sliceStart = ptr;
  while (ptr < endPtr - 1) {
    let c = str[ptr++];
    if (c === "\n" || c === "\r" && str[ptr] === "\n") {
      if (!isMultiline) {
        throw new TomlError("newlines are not allowed in strings", {
          toml: str,
          ptr: ptr - 1
        });
      }
    } else if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in strings", {
        toml: str,
        ptr: ptr - 1
      });
    }
    if (isEscape) {
      isEscape = false;
      if (c === "x" || c === "u" || c === "U") {
        let code = str.slice(ptr, ptr += c === "x" ? 2 : c === "u" ? 4 : 8);
        if (!ESCAPE_REGEX.test(code)) {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
        try {
          parsed += String.fromCodePoint(parseInt(code, 16));
        } catch {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
      } else if (isMultiline && (c === "\n" || c === " " || c === "	" || c === "\r")) {
        ptr = skipVoid(str, ptr - 1, true);
        if (str[ptr] !== "\n" && str[ptr] !== "\r") {
          throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
            toml: str,
            ptr: tmp
          });
        }
        ptr = skipVoid(str, ptr);
      } else if (c in ESC_MAP) {
        parsed += ESC_MAP[c];
      } else {
        throw new TomlError("unrecognized escape sequence", {
          toml: str,
          ptr: tmp
        });
      }
      sliceStart = ptr;
    } else if (!isLiteral && c === "\\") {
      tmp = ptr - 1;
      isEscape = true;
      parsed += str.slice(sliceStart, tmp);
    }
  }
  return parsed + str.slice(sliceStart, endPtr - 1);
}
function parseValue(value, toml, ptr, integersAsBigInt) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid()) {
    throw new TomlError("invalid value", {
      toml,
      ptr
    });
  }
  return date;
}

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/extract.js
function sliceAndTrimEndOf(str, startPtr, endPtr) {
  let value = str.slice(startPtr, endPtr);
  let commentIdx = value.indexOf("#");
  if (commentIdx > -1) {
    skipComment(str, commentIdx);
    value = value.slice(0, commentIdx);
  }
  return [value.trimEnd(), commentIdx];
}
function extractValue(str, ptr, end, depth, integersAsBigInt) {
  if (depth === 0) {
    throw new TomlError("document contains excessively nested structures. aborting.", {
      toml: str,
      ptr
    });
  }
  let c = str[ptr];
  if (c === "[" || c === "{") {
    let [value, endPtr2] = c === "[" ? parseArray(str, ptr, depth, integersAsBigInt) : parseInlineTable(str, ptr, depth, integersAsBigInt);
    if (end) {
      endPtr2 = skipVoid(str, endPtr2);
      if (str[endPtr2] === ",")
        endPtr2++;
      else if (str[endPtr2] !== end) {
        throw new TomlError("expected comma or end of structure", {
          toml: str,
          ptr: endPtr2
        });
      }
    }
    return [value, endPtr2];
  }
  let endPtr;
  if (c === '"' || c === "'") {
    endPtr = getStringEnd(str, ptr);
    let parsed = parseString(str, ptr, endPtr);
    if (end) {
      endPtr = skipVoid(str, endPtr);
      if (str[endPtr] && str[endPtr] !== "," && str[endPtr] !== end && str[endPtr] !== "\n" && str[endPtr] !== "\r") {
        throw new TomlError("unexpected character encountered", {
          toml: str,
          ptr: endPtr
        });
      }
      endPtr += +(str[endPtr] === ",");
    }
    return [parsed, endPtr];
  }
  endPtr = skipUntil(str, ptr, ",", end);
  let slice = sliceAndTrimEndOf(str, ptr, endPtr - +(str[endPtr - 1] === ","));
  if (!slice[0]) {
    throw new TomlError("incomplete key-value declaration: no value specified", {
      toml: str,
      ptr
    });
  }
  if (end && slice[1] > -1) {
    endPtr = skipVoid(str, ptr + slice[1]);
    endPtr += +(str[endPtr] === ",");
  }
  return [
    parseValue(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/struct.js
var KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
function parseKey(str, ptr, end = "=") {
  let dot = ptr - 1;
  let parsed = [];
  let endPtr = str.indexOf(end, ptr);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: str,
      ptr
    });
  }
  do {
    let c = str[ptr = ++dot];
    if (c !== " " && c !== "	") {
      if (c === '"' || c === "'") {
        if (c === str[ptr + 1] && c === str[ptr + 2]) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: str,
            ptr
          });
        }
        let eos = getStringEnd(str, ptr);
        if (eos < 0) {
          throw new TomlError("unfinished string encountered", {
            toml: str,
            ptr
          });
        }
        dot = str.indexOf(".", eos);
        let strEnd = str.slice(eos, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: str,
            ptr: ptr + dot + newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: str,
            ptr: eos
          });
        }
        if (endPtr < eos) {
          endPtr = str.indexOf(end, eos);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: str,
              ptr
            });
          }
        }
        parsed.push(parseString(str, ptr, eos));
      } else {
        dot = str.indexOf(".", ptr);
        let part = str.slice(ptr, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: str,
            ptr
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  return [parsed, skipVoid(str, endPtr + 1, true, true)];
}
function parseInlineTable(str, ptr, depth, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "}" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "	" && c !== "\n" && c !== "\r") {
      let k;
      let t = res;
      let hasOwn = false;
      let [key, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0; i < key.length; i++) {
        if (i)
          t = hasOwn ? t[k] : t[k] = {};
        k = key[i];
        if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: str,
          ptr
        });
      }
      let [value, valueEndPtr] = extractValue(str, keyEndPtr, "}", depth - 1, integersAsBigInt);
      seen.add(value);
      t[k] = value;
      ptr = valueEndPtr;
    }
  }
  if (!c) {
    throw new TomlError("unfinished table encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}
function parseArray(str, ptr, depth, integersAsBigInt) {
  let res = [];
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "]" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "	" && c !== "\n" && c !== "\r") {
      let e = extractValue(str, ptr - 1, "]", depth - 1, integersAsBigInt);
      res.push(e[0]);
      ptr = e[1];
    }
  }
  if (!c) {
    throw new TomlError("unfinished array encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/parse.js
function peekTable(key, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key[i];
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k === "__proto__") {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t, state.c];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let res = {};
  let meta = {};
  let tbl = res;
  let m = meta;
  for (let ptr = skipVoid(toml, 0); ptr < toml.length; ) {
    if (toml[ptr] === "[") {
      let isTableArray = toml[++ptr] === "[";
      let k = parseKey(toml, ptr += +isTableArray, "]");
      if (isTableArray) {
        if (toml[k[1] - 1] !== "]") {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: k[1] - 1
          });
        }
        k[1]++;
      }
      let p = peekTable(
        k[0],
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      m = p[2];
      tbl = p[1];
      ptr = k[1];
    } else {
      let k = parseKey(toml, ptr);
      let p = peekTable(
        k[0],
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      let v = extractValue(toml, k[1], void 0, maxDepth, integersAsBigInt);
      p[1][p[0]] = v[0];
      ptr = v[1];
    }
    ptr = skipVoid(toml, ptr, true);
    if (toml[ptr] && toml[ptr] !== "\n" && toml[ptr] !== "\r") {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr
      });
    }
    ptr = skipVoid(toml, ptr);
  }
  return res;
}

// ../../node_modules/.pnpm/smol-toml@1.6.1/node_modules/smol-toml/dist/stringify.js
var BARE_KEY = /^[a-z0-9-_]+$/i;
function extendedTypeOf(obj) {
  let type = typeof obj;
  if (type === "object") {
    if (Array.isArray(obj))
      return "array";
    if (obj instanceof Date)
      return "date";
  }
  return type;
}
function isArrayOfTables(obj) {
  for (let i = 0; i < obj.length; i++) {
    if (extendedTypeOf(obj[i]) !== "object")
      return false;
  }
  return obj.length != 0;
}
function formatString(s) {
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyValue(val, type, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  if (type === "number") {
    if (isNaN(val))
      return "nan";
    if (val === Infinity)
      return "inf";
    if (val === -Infinity)
      return "-inf";
    if (numberAsFloat && Number.isInteger(val))
      return val.toFixed(1);
    return val.toString();
  }
  if (type === "bigint" || type === "boolean") {
    return val.toString();
  }
  if (type === "string") {
    return formatString(val);
  }
  if (type === "date") {
    if (isNaN(val.getTime())) {
      throw new TypeError("cannot serialize invalid date");
    }
    return val.toISOString();
  }
  if (type === "object") {
    return stringifyInlineTable(val, depth, numberAsFloat);
  }
  if (type === "array") {
    return stringifyArray(val, depth, numberAsFloat);
  }
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
  let keys = Object.keys(obj);
  if (keys.length === 0)
    return "{}";
  let res = "{ ";
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i)
      res += ", ";
    res += BARE_KEY.test(k) ? k : formatString(k);
    res += " = ";
    res += stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat);
  }
  return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
  if (array.length === 0)
    return "[]";
  let res = "[ ";
  for (let i = 0; i < array.length; i++) {
    if (i)
      res += ", ";
    if (array[i] === null || array[i] === void 0) {
      throw new TypeError("arrays cannot contain null or undefined values");
    }
    res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat);
  }
  return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let res = "";
  for (let i = 0; i < array.length; i++) {
    res += `${res && "\n"}[[${key}]]
`;
    res += stringifyTable(0, array[i], key, depth, numberAsFloat);
  }
  return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let preamble = "";
  let tables = "";
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (obj[k] !== null && obj[k] !== void 0) {
      let type = extendedTypeOf(obj[k]);
      if (type === "symbol" || type === "function") {
        throw new TypeError(`cannot serialize values of type '${type}'`);
      }
      let key = BARE_KEY.test(k) ? k : formatString(k);
      if (type === "array" && isArrayOfTables(obj[k])) {
        tables += (tables && "\n") + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
      } else if (type === "object") {
        let tblKey = prefix ? `${prefix}.${key}` : key;
        tables += (tables && "\n") + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat);
      } else {
        preamble += key;
        preamble += " = ";
        preamble += stringifyValue(obj[k], type, depth, numberAsFloat);
        preamble += "\n";
      }
    }
  }
  if (tableKey && (preamble || !tables))
    preamble = preamble ? `[${tableKey}]
${preamble}` : `[${tableKey}]`;
  return preamble && tables ? `${preamble}
${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false } = {}) {
  if (extendedTypeOf(obj) !== "object") {
    throw new TypeError("stringify can only be called with an object");
  }
  let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
  if (str[str.length - 1] !== "\n")
    return str + "\n";
  return str;
}

// ../core/dist/index.js
import { mkdirSync as mkdirSync2, appendFileSync, chmodSync as chmodSync2, existsSync as existsSync3 } from "fs";
import { homedir as homedir3 } from "os";
import { join as join3 } from "path";
import { existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "fs";
import { homedir as homedir4 } from "os";
import { join as join4 } from "path";
function base64url(input) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}
function hashQuery(queryString) {
  return createHash("sha512").update(queryString, "utf8").digest("hex");
}
function createJwt(payload, secretKey) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secretKey).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}
function signRequest(accessKey, secretKey, queryString) {
  const payload = {
    access_key: accessKey,
    nonce: randomUUID(),
    timestamp: Date.now()
  };
  if (queryString && queryString.length > 0) {
    payload.query_hash = hashQuery(queryString);
    payload.query_hash_alg = "SHA512";
  }
  return createJwt(payload, secretKey);
}
var BithumbMcpError = class extends Error {
  type;
  code;
  suggestion;
  endpoint;
  constructor(type, message, options) {
    super(message, options?.cause ? { cause: options.cause } : void 0);
    this.name = type;
    this.type = type;
    this.code = options?.code;
    this.suggestion = options?.suggestion;
    this.endpoint = options?.endpoint;
  }
};
var ConfigError = class extends BithumbMcpError {
  constructor(message, suggestion) {
    super("ConfigError", message, { suggestion });
  }
};
var ValidationError = class extends BithumbMcpError {
  constructor(message, suggestion) {
    super("ValidationError", message, { suggestion });
  }
};
var RateLimitError = class extends BithumbMcpError {
  constructor(message, suggestion, endpoint) {
    super("RateLimitError", message, { suggestion, endpoint });
  }
};
var AuthenticationError = class extends BithumbMcpError {
  constructor(message, suggestion, endpoint) {
    super("AuthenticationError", message, { suggestion, endpoint });
  }
};
var BithumbApiError = class extends BithumbMcpError {
  constructor(message, options) {
    super("BithumbApiError", message, options);
  }
};
var NetworkError = class extends BithumbMcpError {
  constructor(message, endpoint, cause) {
    super("NetworkError", message, {
      endpoint,
      cause,
      suggestion: "Check network connectivity and try again."
    });
  }
};
var RateLimiter = class {
  buckets = /* @__PURE__ */ new Map();
  cleanupMs;
  verbose;
  lastCleanup;
  constructor(cleanupMs = 3e4, verbose = false) {
    this.cleanupMs = cleanupMs;
    this.verbose = verbose;
    this.lastCleanup = Date.now();
  }
  async consume(config, amount = 1) {
    this.maybeCleanup();
    const bucket = this.getBucket(config);
    this.refill(bucket);
    if (bucket.tokens >= amount) {
      bucket.tokens -= amount;
      return;
    }
    const deficit = amount - bucket.tokens;
    const waitMs = Math.ceil(deficit / bucket.refillPerSecond * 1e3);
    if (waitMs > 1e4) {
      throw new RateLimitError(
        `Rate limit exceeded for "${config.key}". Need ${deficit.toFixed(1)} tokens, wait ~${waitMs}ms.`,
        "Reduce request frequency or wait."
      );
    }
    if (this.verbose) {
      process.stderr.write(
        `[rate-limiter] ${config.key}: waiting ${waitMs}ms for ${deficit.toFixed(1)} tokens
`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.refill(bucket);
    if (bucket.tokens >= amount) {
      bucket.tokens -= amount;
      return;
    }
    throw new RateLimitError(
      `Rate limit exceeded for "${config.key}" after waiting.`,
      "Reduce request frequency."
    );
  }
  getBucket(config) {
    let bucket = this.buckets.get(config.key);
    if (!bucket) {
      bucket = {
        tokens: config.capacity,
        capacity: config.capacity,
        refillPerSecond: config.refillPerSecond,
        lastRefill: Date.now()
      };
      this.buckets.set(config.key, bucket);
    }
    return bucket;
  }
  refill(bucket) {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1e3;
    if (elapsed <= 0) return;
    bucket.tokens = Math.min(
      bucket.capacity,
      bucket.tokens + elapsed * bucket.refillPerSecond
    );
    bucket.lastRefill = now;
  }
  maybeCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupMs) return;
    this.lastCleanup = now;
    for (const [key, bucket] of this.buckets) {
      const idle = (now - bucket.lastRefill) / 1e3;
      if (idle > 60 && bucket.tokens >= bucket.capacity) {
        this.buckets.delete(key);
      }
    }
  }
};
var BITHUMB_API_BASE_URL = "https://api.bithumb.com";
var MODULES = ["market", "account", "trade", "twap", "withdraw", "deposit", "system"];
var DEFAULT_MODULES = ["market", "account", "trade", "twap", "withdraw", "deposit", "system"];
var TRADE_KIT_HEADER = "X-AI-Trade-Kit";
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function buildQueryString(query) {
  if (!query) return "";
  const entries = Object.entries(query).filter(([, v]) => isDefined(v));
  if (entries.length === 0) return "";
  const parts = [];
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item && typeof item === "object" && !Array.isArray(item)) {
          for (const [subKey, subVal] of Object.entries(item)) {
            parts.push(
              `${encodeURIComponent(key)}[${i}][${encodeURIComponent(subKey)}]=${encodeURIComponent(String(subVal))}`
            );
          }
        } else {
          parts.push(
            `${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`
          );
        }
      }
    } else {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      );
    }
  }
  return parts.join("&");
}
function buildHashString(query, body) {
  const source = body ?? query;
  if (!source) return "";
  const entries = Object.entries(source).filter(([, v]) => isDefined(v));
  if (entries.length === 0) return "";
  const parts = [];
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item && typeof item === "object" && !Array.isArray(item)) {
          for (const [subKey, subVal] of Object.entries(item)) {
            parts.push(`${key}[${i}][${subKey}]=${String(subVal)}`);
          }
        } else {
          parts.push(`${key}[]=${String(item)}`);
        }
      }
    } else {
      parts.push(`${key}=${String(value)}`);
    }
  }
  return parts.join("&");
}
function vlog(message) {
  process.stderr.write(`[verbose] ${message}
`);
}
var BithumbRestClient = class {
  config;
  rateLimiter;
  constructor(config) {
    this.config = config;
    this.rateLimiter = new RateLimiter(3e4, config.verbose);
  }
  async publicGet(path2, query, rateLimit) {
    return this.request({
      method: "GET",
      path: path2,
      auth: "public",
      query,
      rateLimit
    });
  }
  async privateGet(path2, query, rateLimit) {
    return this.request({
      method: "GET",
      path: path2,
      auth: "private",
      query,
      rateLimit
    });
  }
  async privatePost(path2, body, rateLimit) {
    return this.request({
      method: "POST",
      path: path2,
      auth: "private",
      body,
      rateLimit
    });
  }
  async privateDelete(path2, query, rateLimit) {
    return this.request({
      method: "DELETE",
      path: path2,
      auth: "private",
      query,
      rateLimit
    });
  }
  // ─── Core request ────────────────────────────────────────────────
  async request(reqConfig) {
    const queryString = buildQueryString(reqConfig.query);
    const requestPath = queryString.length > 0 ? `${reqConfig.path}?${queryString}` : reqConfig.path;
    const url = `${this.config.baseUrl}${requestPath}`;
    if (this.config.verbose) vlog(`\u2192 ${reqConfig.method} ${url}`);
    if (reqConfig.rateLimit) await this.rateLimiter.consume(reqConfig.rateLimit);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      [TRADE_KIT_HEADER]: this.config.clientType
    };
    if (reqConfig.auth === "private") {
      if (!this.config.hasAuth || !this.config.accessKey || !this.config.secretKey) {
        throw new ConfigError(
          "Private endpoint requires API credentials.",
          "Set BITHUMB_ACCESS_KEY and BITHUMB_SECRET_KEY."
        );
      }
      const hashStr = buildHashString(reqConfig.query, reqConfig.body);
      const token = signRequest(
        this.config.accessKey,
        this.config.secretKey,
        hashStr
      );
      headers["Authorization"] = `Bearer ${token}`;
    }
    const t0 = Date.now();
    let response;
    try {
      const fetchOptions = {
        method: reqConfig.method,
        headers,
        signal: AbortSignal.timeout(this.config.timeoutMs)
      };
      if (reqConfig.body && reqConfig.method === "POST") {
        fetchOptions.body = JSON.stringify(reqConfig.body);
      }
      response = await fetch(url, fetchOptions);
    } catch (error) {
      if (this.config.verbose) {
        vlog(`\u2717 NetworkError after ${Date.now() - t0}ms`);
      }
      throw new NetworkError(
        `Failed to call ${reqConfig.method} ${reqConfig.path}.`,
        `${reqConfig.method} ${reqConfig.path}`,
        error
      );
    }
    const rawText = await response.text();
    const elapsed = Date.now() - t0;
    if (this.config.verbose) {
      vlog(`\u2190 ${response.status} | ${rawText.length}B | ${elapsed}ms`);
    }
    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new NetworkError(
        `Non-JSON response from ${reqConfig.method} ${reqConfig.path}.`,
        `${reqConfig.method} ${reqConfig.path}`
      );
    }
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const errResp = parsed;
      const errName = errResp.error?.name;
      const errMsg = errResp.error?.message;
      const displayMsg = [errName, errMsg].filter(Boolean).join(": ") || `HTTP ${response.status}`;
      const endpoint = `${reqConfig.method} ${reqConfig.path}`;
      if (response.status === 401) {
        throw new AuthenticationError(
          displayMsg,
          "Check BITHUMB_ACCESS_KEY and BITHUMB_SECRET_KEY.",
          endpoint
        );
      }
      if (response.status === 429) {
        throw new RateLimitError(
          displayMsg,
          "Reduce request frequency.",
          endpoint
        );
      }
      throw new BithumbApiError(displayMsg, {
        code: errName ?? String(response.status),
        endpoint
      });
    }
    if (!response.ok) {
      throw new BithumbApiError(`HTTP ${response.status}`, {
        code: String(response.status),
        endpoint: `${reqConfig.method} ${reqConfig.path}`
      });
    }
    return {
      endpoint: `${reqConfig.method} ${reqConfig.path}`,
      requestTime: (/* @__PURE__ */ new Date()).toISOString(),
      data: parsed
    };
  }
};
function asRecord(args) {
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return args;
  }
  return {};
}
function readString(args, key) {
  const v = args[key];
  if (v === void 0 || v === null || v === "") return void 0;
  return String(v);
}
function readNumber(args, key) {
  const v = args[key];
  if (v === void 0 || v === null || v === "") return void 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return void 0;
  return n;
}
function readBoolean(args, key) {
  const v = args[key];
  if (v === void 0 || v === null) return void 0;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return void 0;
}
function readStringArray(args, key) {
  const v = args[key];
  if (v === void 0 || v === null) return void 0;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return void 0;
}
function requireString(args, key) {
  const v = readString(args, key);
  if (!v) {
    throw new ValidationError(
      `Missing required parameter "${key}".`,
      `Provide a non-empty "${key}" string.`
    );
  }
  return v;
}
function compactObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== void 0 && value !== null) {
      result[key] = value;
    }
  }
  return result;
}
function normalizeResponse(data) {
  if (data === null || data === void 0) return {};
  return data;
}
function publicRateLimit(key, rps = 150) {
  return { key: `public:${key}`, capacity: rps, refillPerSecond: rps };
}
function privateRateLimit(key, rps = 140) {
  return { key: `private:${key}`, capacity: rps, refillPerSecond: rps };
}
function orderRateLimit(key, rps = 10) {
  return { key: `order:${key}`, capacity: rps, refillPerSecond: rps };
}
function registerMarketTools() {
  return [
    // ── 1. market_get_markets ──────────────────────────────────────
    {
      name: "market_get_markets",
      module: "market",
      description: '\uBE57\uC378 \uAC70\uB798 \uAC00\uB2A5\uD55C \uB9C8\uCF13(\uAC70\uB798 \uD398\uC5B4) \uBAA9\uB85D\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get all available trading pairs on Bithumb. Use when: user asks for the list of tradable markets. isDetails: omit by default (API default: false). Pass isDetails=true ONLY when the user explicitly asks about \uC720\uC758 \uC885\uBAA9 (Investment Caution Designation) status \u2014 this adds market_warning (NONE | CAUTION) per market. Do NOT use: for \uC8FC\uC758 \uC885\uBAA9/\uACBD\uBCF4\uC81C (Market Alert with level/reason/expiry) \u2014 use market_get_warnings instead. Do NOT auto-call together with market_get_warnings unless the user explicitly asks for "\uB458 \uB2E4 / \uC804\uBD80".',
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          isDetails: {
            type: "boolean",
            description: "true\uC77C \uACBD\uC6B0 \uC751\uB2F5 \uAC01 \uB9C8\uCF13\uC5D0 market_warning \uD544\uB4DC \uD3EC\uD568 (\uC720\uC758 \uC885\uBAA9 / Investment Caution Designation \uC9C0\uC815 \uC0C1\uD0DC, NONE | CAUTION). \uB2E8\uACC4/\uC0AC\uC720/\uD574\uC81C \uC2DC\uAC01\uC774 \uD544\uC694\uD558\uBA74 market_get_warnings\uB97C \uC0AC\uC6A9."
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/market/all",
          compactObject({ isDetails: readBoolean(args, "isDetails") }),
          publicRateLimit("market_get_markets")
        );
        return normalizeResponse(response);
      }
    },
    // ── 2. market_get_ticker ───────────────────────────────────────
    {
      name: "market_get_ticker",
      module: "market",
      description: "\uD604\uC7AC\uAC00(Ticker) \uC815\uBCF4\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get current price ticker for specified markets.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          markets: {
            type: "string",
            description: "Comma-separated market codes, e.g. KRW-BTC,KRW-ETH"
          }
        },
        required: ["markets"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/ticker",
          compactObject({ markets: requireString(args, "markets") }),
          publicRateLimit("market_get_ticker")
        );
        return normalizeResponse(response);
      }
    },
    // ── 3. market_get_orderbook ────────────────────────────────────
    {
      name: "market_get_orderbook",
      module: "market",
      description: "\uD638\uAC00(Orderbook) \uC815\uBCF4\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get orderbook (bids/asks) for specified markets.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          markets: {
            type: "string",
            description: "Comma-separated market codes, e.g. KRW-BTC,KRW-ETH"
          }
        },
        required: ["markets"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/orderbook",
          compactObject({ markets: requireString(args, "markets") }),
          publicRateLimit("market_get_orderbook")
        );
        return normalizeResponse(response);
      }
    },
    // ── 4. market_get_trades ───────────────────────────────────────
    {
      name: "market_get_trades",
      module: "market",
      description: "\uCD5C\uADFC \uCCB4\uACB0 \uB0B4\uC5ED\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get recent trades for a market.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          to: {
            type: "string",
            description: "\uC870\uD68C \uAE30\uC900 \uC2DC\uAC01 \u2014 time-of-day only (KST). \uD615\uC2DD: HHmmss \uB610\uB294 HH:mm:ss (00:00:00\u201323:59:59). \uCE94\uB4E4 to\uC640 \uB2EC\uB9AC \uB0A0\uC9DC\uB294 \uBC1B\uC9C0 \uC54A\uB294\uB2E4 \u2014 \uACFC\uAC70 \uC77C\uC790\uB294 daysAgo(1\u20137)\uB85C \uC9C0\uC815. \uBBF8\uC785\uB825 \uC2DC: daysAgo\uB3C4 \uC5C6\uC73C\uBA74 \uD604\uC7AC \uC2DC\uAC01 \uAE30\uC900, daysAgo \uC788\uC73C\uBA74 \uD574\uB2F9 \uC77C\uC790 00:00:00 \uAE30\uC900."
          },
          count: {
            type: "number",
            description: "Number of trades to return (1\u2013500, default 1)"
          },
          cursor: {
            type: "string",
            description: "Pagination cursor \u2014 use sequential_id from previous response"
          },
          daysAgo: {
            type: "number",
            description: "Filter trades from N days ago (1\u20137). Without this, query targets the current time."
          }
        },
        required: ["market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/trades/ticks",
          compactObject({
            market: requireString(args, "market"),
            to: readString(args, "to"),
            count: readNumber(args, "count"),
            cursor: readString(args, "cursor"),
            daysAgo: readNumber(args, "daysAgo")
          }),
          publicRateLimit("market_get_trades")
        );
        return normalizeResponse(response);
      }
    },
    // ── 5. market_get_candles_minutes ──────────────────────────────
    {
      name: "market_get_candles_minutes",
      module: "market",
      description: "\uBD84(minute) \uCE94\uB4E4\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get minute candles (OHLCV).",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          unit: {
            type: "number",
            enum: [1, 3, 5, 10, 15, 30, 60, 240],
            description: "Candle unit in minutes"
          },
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          to: {
            type: "string",
            description: "Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)"
          },
          count: {
            type: "number",
            description: "Number of candles to return (max 200)"
          }
        },
        required: ["unit", "market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const unit = readNumber(args, "unit");
        if (!unit) throw new Error('Missing required parameter "unit".');
        const response = await context.client.publicGet(
          `/v1/candles/minutes/${unit}`,
          compactObject({
            market: requireString(args, "market"),
            to: readString(args, "to"),
            count: readNumber(args, "count")
          }),
          publicRateLimit("market_get_candles_minutes")
        );
        return normalizeResponse(response);
      }
    },
    // ── 6. market_get_candles_days ─────────────────────────────────
    {
      name: "market_get_candles_days",
      module: "market",
      description: "\uC77C(day) \uCE94\uB4E4\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get daily candles.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          to: {
            type: "string",
            description: "Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)"
          },
          count: {
            type: "number",
            description: "Number of candles to return (max 200)"
          },
          convertingPriceUnit: {
            type: "string",
            description: "Convert the close price (trade_price) to KRW for non-KRW markets such as BTC-ETH; the result populates the `converted_trade_price` field. Bithumb supports KRW only. KRW-quoted markets (e.g. KRW-BTC) are already KRW and return null."
          }
        },
        required: ["market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/candles/days",
          compactObject({
            market: requireString(args, "market"),
            to: readString(args, "to"),
            count: readNumber(args, "count"),
            convertingPriceUnit: readString(args, "convertingPriceUnit")
          }),
          publicRateLimit("market_get_candles_days")
        );
        return normalizeResponse(response);
      }
    },
    // ── 7. market_get_candles_weeks ────────────────────────────────
    {
      name: "market_get_candles_weeks",
      module: "market",
      description: "\uC8FC(week) \uCE94\uB4E4\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get weekly candles.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          to: {
            type: "string",
            description: "Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)"
          },
          count: {
            type: "number",
            description: "Number of candles to return (max 200)"
          }
        },
        required: ["market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/candles/weeks",
          compactObject({
            market: requireString(args, "market"),
            to: readString(args, "to"),
            count: readNumber(args, "count")
          }),
          publicRateLimit("market_get_candles_weeks")
        );
        return normalizeResponse(response);
      }
    },
    // ── 8. market_get_candles_months ───────────────────────────────
    {
      name: "market_get_candles_months",
      module: "market",
      description: "\uC6D4(month) \uCE94\uB4E4\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get monthly candles.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          to: {
            type: "string",
            description: "Fetch candles before this time (KST naive, no offset), exclusive (e.g. 2026-01-01T00:00:00)"
          },
          count: {
            type: "number",
            description: "Number of candles to return (max 200)"
          }
        },
        required: ["market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/v1/candles/months",
          compactObject({
            market: requireString(args, "market"),
            to: readString(args, "to"),
            count: readNumber(args, "count")
          }),
          publicRateLimit("market_get_candles_months")
        );
        return normalizeResponse(response);
      }
    },
    // ── 9. market_get_warnings ─────────────────────────────────────
    {
      name: "market_get_warnings",
      module: "market",
      description: `\uC8FC\uC758 \uC885\uBAA9/\uACBD\uBCF4\uC81C(Market Alert) \uBAA9\uB85D\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get the market alert list \u2014 markets currently flagged by Bithumb's automated detection. Use when: user asks about \uC8FC\uC758 \uC885\uBAA9 / \uACBD\uBCF4 / \uC774\uC0C1\uAC70\uB798 \uD0D0\uC9C0, or wants warning_step (CAUTION/WARNING/DANGER) / warning_type (5 reasons) / end_date (auto-clear time). Do NOT use: for \uC720\uC758 \uC885\uBAA9 (Investment Caution Designation, exchange-curated NONE/CAUTION) \u2014 use market_get_markets with isDetails=true instead. Do NOT auto-call together with market_get_markets unless the user explicitly asks for "\uB458 \uB2E4 / \uC804\uBD80".`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.publicGet(
          "/v1/market/virtual_asset_warning",
          {},
          publicRateLimit("market_get_warnings")
        );
        return normalizeResponse(response);
      }
    },
    // ── 10. market_get_notices ─────────────────────────────────────
    {
      name: "market_get_notices",
      module: "market",
      description: "\uACF5\uC9C0\uC0AC\uD56D \uBAA9\uB85D\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get notice list.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of notices to return (min 1, max 20, default 5)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const count = readNumber(args, "count");
        const response = await context.client.publicGet(
          "/v1/notices",
          compactObject({ count }),
          publicRateLimit("market_get_notices")
        );
        return normalizeResponse(response);
      }
    },
    // ── 11. market_get_fee_inout ───────────────────────────────────
    {
      name: "market_get_fee_inout",
      module: "market",
      description: "\uC785\uCD9C\uAE08 \uC218\uC218\uB8CC\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get deposit/withdrawal fee info for a currency.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: 'Currency symbol (use "ALL" to retrieve all currencies), e.g. BTC, ETH'
          }
        },
        required: ["currency"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const currency = requireString(args, "currency");
        const response = await context.client.publicGet(
          `/v2/fee/inout/${currency}`,
          {},
          publicRateLimit("market_get_fee_inout")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
function registerAccountTools() {
  return [
    // ── 1. account_get_assets ──────────────────────────────────────
    {
      name: "account_get_assets",
      module: "account",
      description: "\uC804\uCCB4 \uACC4\uC88C \uC794\uACE0\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get all account balances. Returns all currencies with balance, locked amounts, and avg buy price. Run before any trade or withdrawal to verify available funds.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v1/accounts",
          void 0,
          privateRateLimit("account_get_assets")
        );
        return normalizeResponse(response);
      }
    },
    // ── 2. account_get_order_chance ────────────────────────────────
    {
      name: "account_get_order_chance",
      module: "account",
      description: "\uC8FC\uBB38 \uAC00\uB2A5 \uC815\uBCF4\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get order chance info (available balance, fees, limits) for a market. Run before placing any order to confirm available balance, bid/ask fee rates, and min/max order size constraints.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          }
        },
        required: ["market"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/orders/chance",
          compactObject({ market: requireString(args, "market") }),
          privateRateLimit("account_get_order_chance")
        );
        return normalizeResponse(response);
      }
    },
    // ── 3. account_get_wallet_status ───────────────────────────────
    {
      name: "account_get_wallet_status",
      module: "account",
      description: "\uC785\uCD9C\uAE08 \uD604\uD669\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get wallet status (block status, deposit/withdrawal availability). Run before any deposit or withdrawal to verify the blockchain is synced and operations are not disabled for maintenance.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v1/status/wallet",
          {},
          privateRateLimit("account_get_wallet_status")
        );
        return normalizeResponse(response);
      }
    },
    // ── 4. account_get_api_keys ────────────────────────────────────
    {
      name: "account_get_api_keys",
      module: "account",
      description: "API \uD0A4 \uBAA9\uB85D\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get list of API keys and expiration dates. Check periodically to avoid unexpected authentication failures due to key expiration.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v1/api_keys",
          {},
          privateRateLimit("account_get_api_keys")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
function registerTradeTools() {
  return [
    // ── 1. trade_get_order ─────────────────────────────────────────
    {
      name: "trade_get_order",
      module: "trade",
      description: `\uAC1C\uBCC4(\uB2E8\uAC74) \uC8FC\uBB38\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get a SINGLE order by order_id or client_order_id. Use when: you have exactly one order identifier. Do NOT use: for multiple orders at once \u2014 do NOT call this repeatedly. Pass all identifiers to trade_get_orders (order_ids/client_order_ids arrays) in a single call instead. ID \uB77C\uC6B0\uD305: \uC0AC\uC6A9\uC790\uAC00 \uBA85\uC2DC\uC801\uC73C\uB85C 'client-order-id'\uB77C\uACE0 \uD45C\uD604\uD588\uC73C\uBA74 \uC989\uC2DC client_order_id\uB85C \uC870\uD68C. \uADF8 \uC678\uC5D0\uB294 order_id\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 \uACB0\uACFC\uAC00 \uC5C6\uC73C\uBA74(order_not_found / 404) client_order_id\uB85C \uB2E4\uC2DC \uC870\uD68C(\uD3F4\uBC31)\uD55C\uB2E4. Bithumb\uC740 client_order_id \uD615\uC2DD\uC744 \uAC15\uC81C\uD558\uC9C0 \uC54A\uC544 \uC0AC\uC6A9\uC790\uAC00 order_id \uD328\uD134(C+\uC22B\uC790)\uACFC \uB3D9\uC77C\uD558\uAC8C \uB9CC\uB4E4 \uC218 \uC788\uC73C\uBBC0\uB85C \uC785\uB825\uAC12\uC73C\uB85C \uCD94\uCE21\uD558\uC9C0 \uC54A\uB294\uB2E4. Example call: {"order_id":"C0101..."}`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID"
          },
          client_order_id: {
            type: "string",
            description: "Client-assigned order ID (1\u201336 chars; letters, digits, hyphens, underscores only)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/order",
          compactObject({
            uuid: readString(args, "order_id"),
            client_order_id: readString(args, "client_order_id")
          }),
          privateRateLimit("trade_get_order")
        );
        return normalizeResponse(response);
      }
    },
    // ── 2. trade_get_orders ────────────────────────────────────────
    {
      name: "trade_get_orders",
      module: "trade",
      description: '\uC8FC\uBB38 \uB9AC\uC2A4\uD2B8/\uBCF5\uC218 \uC8FC\uBB38\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get orders \u2014 fetch MULTIPLE specific orders in one call via order_ids/client_order_ids (arrays), or list by market/state filters. Use when: the user gives two or more order numbers, or wants a filtered list. Do NOT use trade_get_order repeatedly for multiple ids \u2014 pass them all here in one call. Note: the server defaults to state=wait when omitted, so to fetch done/cancel orders (e.g. by order_ids) set states explicitly, e.g. states=["wait","done","cancel"]. The auto-order state (watch) CANNOT be mixed with general states (wait/done/cancel); query it separately with state=watch. state and states cannot be used together. Batch size: up to 100 ids per call (server limit). For more than 100, split into chunks of 100. Example call: {"order_ids":["C0101...","C0102..."],"states":["wait","done","cancel"]}',
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          state: {
            type: "string",
            enum: ["wait", "watch", "done", "cancel"],
            description: "Order state filter"
          },
          states: {
            type: "array",
            items: { type: "string" },
            description: 'Multiple order state filters. Constraints: general states (wait/done/cancel) and the auto-order state (watch) CANNOT be mixed in one query; state and states cannot be used together. If omitted, the server defaults to state=wait \u2014 pass states=["wait","done","cancel"] to include done/cancel orders.'
          },
          order_ids: {
            type: "array",
            items: { type: "string" },
            description: "Fetch multiple specific orders by order ID in one call (batch lookup). Pass all order IDs here instead of calling trade_get_order repeatedly. Up to 100 ids per call (max 100)."
          },
          client_order_ids: {
            type: "array",
            items: { type: "string" },
            description: "Fetch multiple orders by client-assigned order ID in one call (batch lookup, max 100). Each id: 1\u201336 chars; letters, digits, hyphens, underscores only. Pass all client order IDs here instead of calling trade_get_order repeatedly."
          },
          page: {
            type: "number",
            description: "Page number"
          },
          limit: {
            type: "number",
            description: "Number of results per page"
          },
          order_by: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order: asc (oldest first) or desc (newest first, default)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/orders",
          compactObject({
            market: readString(args, "market"),
            state: readString(args, "state"),
            states: readStringArray(args, "states"),
            uuids: readStringArray(args, "order_ids"),
            client_order_ids: readStringArray(args, "client_order_ids"),
            page: readNumber(args, "page"),
            limit: readNumber(args, "limit"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("trade_get_orders")
        );
        return normalizeResponse(response);
      }
    },
    // ── 3. trade_place_order ───────────────────────────────────────
    {
      name: "trade_place_order",
      module: "trade",
      description: '\uC8FC\uBB38\uC744 \uC0DD\uC131\uD569\uB2C8\uB2E4. Place a new spot order on Bithumb. Use when: user asks to buy/sell a single market at a specific price or quantity. Do NOT use: for multiple orders at once (use trade_batch_place); for time-weighted execution (use twap_place). Field: order_type \u2208 {limit, price, market}. limit: price+volume required. price(\uC2DC\uC7A5\uAC00 \uB9E4\uC218): only price (total KRW). market(\uC2DC\uC7A5\uAC00 \uB9E4\uB3C4): only volume (coin qty). \uBAA8\uB4E0 limit \uAC00\uACA9\uC740 \uCD9C\uCC98(\uC9C1\uC811 \uC785\uB825\xB7\uACC4\uC0B0\xB7\uD37C\uC13C\uD2B8)\uC640 \uBB34\uAD00\uD558\uAC8C \uD638\uAC00\uB2E8\uC704(price tick)\uC5D0 \uC815\uB82C\uB3FC\uC57C \uD55C\uB2E4. \uC815\uB82C\uB418\uC9C0 \uC54A\uC740 \uAC00\uACA9(\uC608: 123,456\uC6D0)\uC740 \uBE57\uC378\uC774 \uAC70\uBD80\uD558\uBBC0\uB85C \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 \uC720\uD6A8 \uD638\uAC00\uB85C round \uC815\uADDC\uD654\uD55C \uB4A4, \uD655\uC778 \uB2E8\uACC4\uC5D0\uC11C \uC6D0\uBCF8/\uBCF4\uC815\uAC12\uC744 \uD568\uAED8 \uBCF4\uC5EC\uC900\uB2E4 (\uD45C\xB7\uC808\uCC28\uB294 bithumb-trade \uC2A4\uD0AC order-commands.md). Note: Bithumb API response field is `ord_type` (not `order_type`). \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user market, side, order_type, price, volume, and total notional, then wait for explicit approval. Do NOT place the order without user confirmation. Example call: {"market":"KRW-BTC","side":"bid","order_type":"limit","price":"50000000","volume":"0.0001"} CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.',
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "Market code, e.g. KRW-BTC"
          },
          side: {
            type: "string",
            enum: ["bid", "ask"],
            description: "Order side: bid (buy) or ask (sell)"
          },
          order_type: {
            type: "string",
            enum: ["limit", "price", "market"],
            description: "Order type: limit, price (market buy), market (market sell). Note: Bithumb API response field is `ord_type` (not `order_type`)."
          },
          price: {
            type: "string",
            description: "Order price (required for limit and price orders)"
          },
          volume: {
            type: "string",
            description: "Order volume (required for limit and market orders)"
          },
          client_order_id: {
            type: "string",
            description: "Client-assigned order ID for idempotency (1\u201336 chars; letters, digits, hyphens, underscores only)"
          }
        },
        required: ["market", "side", "order_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/orders",
          compactObject({
            market: requireString(args, "market"),
            side: requireString(args, "side"),
            order_type: requireString(args, "order_type"),
            price: readString(args, "price"),
            volume: readString(args, "volume"),
            client_order_id: readString(args, "client_order_id")
          }),
          orderRateLimit("trade_place_order")
        );
        return normalizeResponse(response);
      }
    },
    // ── 4. trade_cancel_order ──────────────────────────────────────
    {
      name: "trade_cancel_order",
      module: "trade",
      description: "\uC8FC\uBB38\uC744 \uCDE8\uC18C\uD569\uB2C8\uB2E4. Cancel an order by order_id or client_order_id. ID \uB77C\uC6B0\uD305: \uC0AC\uC6A9\uC790\uAC00 \uBA85\uC2DC\uC801\uC73C\uB85C 'client-order-id'\uB77C\uACE0 \uD45C\uD604\uD588\uC73C\uBA74 \uC989\uC2DC client_order_id\uB85C \uCDE8\uC18C \uC2DC\uB3C4. \uADF8 \uC678\uC5D0\uB294 order_id\uB85C \uBA3C\uC800 \uCDE8\uC18C \uC2DC\uB3C4 \u2192 \uACB0\uACFC\uAC00 \uC5C6\uC73C\uBA74(order_not_found / 404) client_order_id\uB85C \uB2E4\uC2DC \uC2DC\uB3C4(\uD3F4\uBC31)\uD55C\uB2E4. Bithumb\uC740 client_order_id \uD615\uC2DD\uC744 \uAC15\uC81C\uD558\uC9C0 \uC54A\uC544 \uC0AC\uC6A9\uC790\uAC00 order_id \uD328\uD134\uACFC \uB3D9\uC77C\uD558\uAC8C \uB9CC\uB4E4 \uC218 \uC788\uC73C\uBBC0\uB85C \uC785\uB825\uAC12\uC73C\uB85C \uCD94\uCE21\uD558\uC9C0 \uC54A\uB294\uB2E4. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the order details (order_id or client_order_id) and wait for explicit approval. Do NOT cancel without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID to cancel"
          },
          client_order_id: {
            type: "string",
            description: "Client-assigned order ID to cancel (1\u201336 chars; letters, digits, hyphens, underscores only)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/v2/order",
          compactObject({
            order_id: readString(args, "order_id"),
            client_order_id: readString(args, "client_order_id")
          }),
          orderRateLimit("trade_cancel_order")
        );
        return normalizeResponse(response);
      }
    },
    // ── 5. trade_batch_place ───────────────────────────────────────
    {
      name: "trade_batch_place",
      module: "trade",
      description: '\uB2E4\uAC74 \uC8FC\uBB38\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4. Place multiple orders in a single batch (max 20). Use when: user asks for multiple orders at once (e.g., grid orders, simultaneous BTC+ETH limit buys). Do NOT use: for a single order (use trade_place_order); for time-sliced execution (use twap_place). Each order item field: `order_type` (canonical) \u2208 {limit, price, market}. \uAC01 limit \uC8FC\uBB38\uC758 price\uB294 \uCD9C\uCC98\uC640 \uBB34\uAD00\uD558\uAC8C \uD638\uAC00\uB2E8\uC704(price tick)\uC5D0 \uC815\uB82C\uB3FC\uC57C \uD55C\uB2E4. \uC815\uB82C\uB418\uC9C0 \uC54A\uC740 \uAC12\uC740 round \uC815\uADDC\uD654 \uD6C4 \uD655\uC778 \uB2E8\uACC4\uC5D0\uC11C \uC6D0\uBCF8/\uBCF4\uC815\uAC12\uC744 \uD568\uAED8 \uBCF4\uC5EC\uC900\uB2E4 (bithumb-trade \uC2A4\uD0AC order-commands.md). Partial-failure semantics: each item may succeed or fail independently. Do NOT auto-retry failed items; surface them to the user. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: read all orders back to the user (market, side, order_type, price, volume for each) and wait for explicit approval. Do NOT place any order without user confirmation. Example call: {"batch_orders":[{"market":"KRW-BTC","side":"bid","order_type":"limit","price":"50000000","volume":"0.0001"},{"market":"KRW-ETH","side":"bid","order_type":"limit","price":"4500000","volume":"0.001"}]} CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.',
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          batch_orders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                market: { type: "string", description: "Market code, e.g. KRW-BTC" },
                side: { type: "string", enum: ["bid", "ask"], description: "Order side" },
                order_type: { type: "string", enum: ["limit", "price", "market"], description: "Order type" },
                price: { type: "string", description: "Order price" },
                volume: { type: "string", description: "Order volume" },
                client_order_id: { type: "string", description: "Client-assigned order ID (1\u201336 chars; letters, digits, hyphens, underscores only)" }
              },
              required: ["market", "side", "order_type"]
            },
            description: "Array of order objects (max 20)"
          }
        },
        required: ["batch_orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const batchOrders = args.batch_orders;
        if (!Array.isArray(batchOrders) || batchOrders.length === 0) {
          throw new ValidationError(
            'Missing required parameter "batch_orders".',
            "Provide an array of order objects."
          );
        }
        const response = await context.client.privatePost(
          "/v2/orders/batch",
          { batch_orders: batchOrders },
          orderRateLimit("trade_batch_place")
        );
        return normalizeResponse(response);
      }
    },
    // ── 6. trade_batch_cancel ──────────────────────────────────────
    {
      name: "trade_batch_cancel",
      module: "trade",
      description: "\uB2E4\uAC74 \uC8FC\uBB38\uC744 \uCDE8\uC18C\uD569\uB2C8\uB2E4. Cancel multiple orders (max 30). Provide order_ids or client_order_ids. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user all order IDs to be cancelled and wait for explicit approval. Do NOT cancel without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          order_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of order IDs to cancel (max 30)"
          },
          client_order_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of client-assigned order IDs to cancel (max 30; each id 1\u201336 chars; letters, digits, hyphens, underscores only)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v2/orders/cancel",
          compactObject({
            order_ids: readStringArray(args, "order_ids"),
            client_order_ids: readStringArray(args, "client_order_ids")
          }),
          orderRateLimit("trade_batch_cancel")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
var DEFAULT_LOG_DIR = path.join(os.homedir(), ".bithumb", "logs");
function getLogPaths(logDir, days = 7) {
  const paths = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    paths.push(path.join(logDir, `trade-${yyyy}-${mm}-${dd}.log`));
  }
  return paths;
}
function readEntries(logDir) {
  const filePaths = getLogPaths(logDir);
  const entries = [];
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed);
        entries.push(entry);
      } catch {
      }
    }
  }
  return entries;
}
function extractTool(entry) {
  if (entry.tool) return entry.tool;
  if (typeof entry.message === "string" && entry.message.startsWith("tool:")) {
    return entry.message.slice("tool:".length);
  }
  return void 0;
}
function registerAuditTools(logDir) {
  const resolvedLogDir = logDir ?? DEFAULT_LOG_DIR;
  return [
    // ── system_get_audit_log ───────────────────────────────────────
    {
      name: "system_get_audit_log",
      module: "system",
      description: "\uB85C\uCEEC \uB85C\uADF8\uC5D0\uC11C \uAC70\uB798 \uC774\uB825\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Read local audit logs filtered by tool, level, and time.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of entries to return (default 20)."
          },
          tool: {
            type: "string",
            description: "Filter by tool name."
          },
          level: {
            type: "string",
            enum: ["INFO", "WARN", "ERROR", "DEBUG"],
            description: "Filter by log level (case-insensitive)."
          },
          since: {
            type: "string",
            description: "ISO 8601 timestamp; return entries at or after this time."
          }
        },
        required: []
      },
      handler: async (rawArgs, _context) => {
        const args = asRecord(rawArgs);
        const limit = readNumber(args, "limit") ?? 20;
        const toolFilter = readString(args, "tool");
        const levelFilter = readString(args, "level")?.toLowerCase();
        const sinceStr = readString(args, "since");
        const sinceMs = sinceStr ? new Date(sinceStr).getTime() : void 0;
        const entries = readEntries(resolvedLogDir);
        const filtered = entries.filter((entry) => {
          if (toolFilter) {
            const t = extractTool(entry);
            if (!t || !t.includes(toolFilter)) return false;
          }
          if (levelFilter && entry.level !== levelFilter) return false;
          if (sinceMs !== void 0) {
            const entryMs = new Date(entry.ts).getTime();
            if (Number.isNaN(entryMs) || entryMs < sinceMs) return false;
          }
          return true;
        });
        filtered.sort((a, b) => {
          const ta = new Date(a.ts).getTime();
          const tb = new Date(b.ts).getTime();
          return tb - ta;
        });
        return {
          endpoint: "local:audit-log",
          requestTime: (/* @__PURE__ */ new Date()).toISOString(),
          data: filtered.slice(0, limit)
        };
      }
    }
  ];
}
async function checkAuthLive(client) {
  try {
    await client.privateGet("/v1/accounts");
    return {
      name: "Auth Validity",
      status: "pass",
      message: "API key accepted by server"
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return {
        name: "Auth Validity",
        status: "fail",
        message: `API key rejected by server (${err.message}). Check your access_key and secret_key.`
      };
    }
    if (err instanceof NetworkError) {
      return {
        name: "Auth Validity",
        status: "fail",
        message: `Could not reach API to verify credentials: ${err.message}`
      };
    }
    return {
      name: "Auth Validity",
      status: "fail",
      message: `Unexpected error during auth check: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
async function checkApiReachability(baseUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    const res = await fetch(`${baseUrl}/v1/market/all`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    return {
      name: "API Reachability",
      status: res.ok ? "pass" : "fail",
      message: res.ok ? `${baseUrl} reachable (HTTP ${res.status})` : `${baseUrl} returned HTTP ${res.status}`
    };
  } catch (err) {
    return {
      name: "API Reachability",
      status: "fail",
      message: `Cannot reach ${baseUrl}: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
function checkAuthentication(hasAuth) {
  if (hasAuth) {
    return { name: "Authentication", status: "pass", message: "API keys configured (BITHUMB_ACCESS_KEY/BITHUMB_SECRET_KEY env vars or config.toml profile)" };
  }
  return { name: "Authentication", status: "fail", message: "No credentials found. Set BITHUMB_ACCESS_KEY/BITHUMB_SECRET_KEY env vars or create a config.toml profile." };
}
function checkTomlConfig() {
  const tomlPath = join(homedir(), ".bithumb", "config.toml");
  if (existsSync(tomlPath)) {
    return { name: "TOML Config", status: "pass", message: `Found ${tomlPath}` };
  }
  return { name: "TOML Config", status: "fail", message: `Not found: ${tomlPath} (optional \u2014 run 'bithumb config init' to create)` };
}
function checkModules(enabledModules) {
  return {
    name: "Enabled Modules",
    status: "pass",
    message: `Active: ${enabledModules.join(", ")}`
  };
}
function registerDiagnoseTools() {
  return [
    {
      name: "system_diagnose",
      module: "system",
      description: "Run diagnostic checks on the Bithumb Trade Kit configuration. Checks API reachability, authentication, TOML config, and module status.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {}
      },
      handler: async (_args, context) => {
        const baseUrl = context?.config?.baseUrl ?? BITHUMB_API_BASE_URL;
        const modules = context?.config?.modules ?? [];
        const hasAuth = context?.config?.hasAuth ?? false;
        const checks = [];
        const reachabilityCheck = await checkApiReachability(baseUrl);
        checks.push(reachabilityCheck);
        const authCheck = checkAuthentication(hasAuth);
        checks.push(authCheck);
        checks.push(checkTomlConfig());
        checks.push(checkModules(modules));
        if (authCheck.status === "pass" && reachabilityCheck.status === "pass") {
          checks.push(await checkAuthLive(context.client));
        }
        const passed = checks.filter((c) => c.status === "pass").length;
        const total = checks.length;
        return {
          endpoint: "local:diagnose",
          requestTime: (/* @__PURE__ */ new Date()).toISOString(),
          data: {
            summary: `${passed}/${total} checks passed`,
            checks
          }
        };
      }
    }
  ];
}
function registerTwapTools() {
  return [
    // ── 6. twap_place_order ────────────────────────────────────────
    {
      name: "twap_place_order",
      module: "twap",
      description: "TWAP \uC8FC\uBB38\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4. Place a TWAP (Time-Weighted Average Price) order. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user market, side, price/volume, duration, frequency, and computed slice count (duration \xF7 frequency), then wait for explicit approval. Do NOT place the order without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "\uAC70\uB798 \uB300\uC0C1 \uD398\uC5B4\uC758 \uACE0\uC720 \uC2EC\uBCFC (\uC608\uC2DC: KRW-BTC)"
          },
          side: {
            type: "string",
            enum: ["bid", "ask"],
            description: "\uC8FC\uBB38 \uC885\uB958: bid (\uB9E4\uC218), ask (\uB9E4\uB3C4)"
          },
          duration: {
            type: "string",
            description: "\uC8FC\uBB38 \uC2DC\uAC04 - TWAP \uC8FC\uBB38\uC774 \uC9C4\uD589\uB418\uB294 \uC2DC\uAC04(\uCD08). min 300, max 43200"
          },
          frequency: {
            type: "string",
            enum: ["15", "20", "30", "60", "120"],
            description: "\uC8FC\uBB38 \uAC04\uACA9(\uCD08)"
          },
          volume: {
            type: "string",
            description: "\uC8FC\uBB38 \uC218\uB7C9 (\uB9E4\uB3C4 \uC2DC \uD544\uC218)"
          },
          price: {
            type: "string",
            description: "\uC8FC\uBB38 \uAC00\uACA9 (\uB9E4\uC218 \uC2DC \uD544\uC218)"
          }
        },
        required: ["market", "side", "duration", "frequency"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v1/twap",
          compactObject({
            market: requireString(args, "market"),
            side: requireString(args, "side"),
            duration: requireString(args, "duration"),
            frequency: requireString(args, "frequency"),
            volume: readString(args, "volume"),
            price: readString(args, "price")
          }),
          orderRateLimit("twap_place_order")
        );
        return normalizeResponse(response);
      }
    },
    // ── 7. twap_get_orders ─────────────────────────────────────────
    {
      name: "twap_get_orders",
      module: "twap",
      description: "TWAP \uC8FC\uBB38 \uB0B4\uC5ED\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. Get TWAP order history. Use after twap_place_order to verify the order is active (state: progress). Default state filter is 'progress'; pass state: 'done' or 'cancel' to query completed or cancelled orders.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          market: {
            type: "string",
            description: "\uAC70\uB798 \uB300\uC0C1 \uD398\uC5B4\uC758 \uACE0\uC720 \uC2EC\uBCFC (\uC608\uC2DC: KRW-BTC)"
          },
          order_ids: {
            type: "array",
            items: { type: "string" },
            description: "TWAP \uC8FC\uBB38 ID \uBAA9\uB85D"
          },
          state: {
            type: "string",
            enum: ["progress", "done", "cancel"],
            description: "\uC8FC\uBB38 \uC0C1\uD0DC: progress (\uC9C4\uD589\uC911, default), done (\uC644\uB8CC), cancel (\uCDE8\uC18C)"
          },
          next_key: {
            type: "string",
            description: "\uB2E4\uC74C \uD398\uC774\uC9C0 \uC870\uD68C\uB97C \uC704\uD55C \uCEE4\uC11C \uAC12"
          },
          limit: {
            type: "number",
            description: "\uAC1C\uC218 \uC81C\uD55C (max 100)"
          },
          order_by: {
            type: "string",
            enum: ["asc", "desc"],
            description: "\uC870\uD68C \uACB0\uACFC \uC815\uB82C \uBC29\uC2DD: asc (\uC624\uB984\uCC28\uC21C), desc (\uB0B4\uB9BC\uCC28\uC21C, default)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/twap",
          compactObject({
            market: readString(args, "market"),
            uuids: readStringArray(args, "order_ids"),
            state: readString(args, "state"),
            next_key: readString(args, "next_key"),
            limit: readNumber(args, "limit"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("twap_get_orders")
        );
        return normalizeResponse(response);
      }
    },
    // ── 8. twap_cancel_order ───────────────────────────────────────
    {
      name: "twap_cancel_order",
      module: "twap",
      description: "TWAP \uC8FC\uBB38\uC744 \uCDE8\uC18C\uD569\uB2C8\uB2E4. Cancel a TWAP order. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the TWAP order ID and wait for explicit approval. Do NOT cancel without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          algo_order_id: {
            type: "string",
            description: "\uCDE8\uC18C\uD560 TWAP \uC8FC\uBB38 ID"
          }
        },
        required: ["algo_order_id"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const algo_order_id = requireString(args, "algo_order_id");
        const response = await context.client.privateDelete(
          "/v1/twap",
          { algo_order_id },
          orderRateLimit("twap_cancel_order")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
function registerWithdrawTools() {
  return [
    // ── 9. withdraw_get_chance ───────────────────────────────────────
    {
      name: "withdraw_get_chance",
      module: "withdraw",
      description: "\uCD9C\uAE08 \uAC00\uB2A5 \uC815\uBCF4\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get withdrawal chance info (available balance, fees, limits). Always call this before withdraw_coin to confirm supported net_type values, withdrawal fee, minimum amount, and daily limits. For multi-network coins (USDT, USDC, XRP, etc.), this is the only way to discover valid net_type values \u2014 never guess.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          net_type: {
            type: "string",
            description: "Withdrawal network, e.g. BTC, DASH"
          }
        },
        required: ["currency", "net_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/withdraws/chance",
          {
            currency: requireString(args, "currency"),
            net_type: requireString(args, "net_type")
          },
          privateRateLimit("withdraw_get_chance")
        );
        return normalizeResponse(response);
      }
    },
    // ── 10. withdraw_get ─────────────────────────────────────────────
    {
      name: "withdraw_get",
      module: "withdraw",
      description: `\uC2DD\uBCC4\uC790(txid \uB610\uB294 withdrawal_id) 1\uAC1C\uB85C \uD2B9\uC815 \uCD9C\uAE08 1\uAC74\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. \uB2E8\uAC74 \uC870\uD68C\uC758 canonical \uB3C4\uAD6C. Single withdrawal by one identifier. Use when: you have one txid or withdrawal_id. Do NOT use: to search history or filter by state \u2014 use withdraw_get_list instead. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uC911\uC694): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. \uB9E8 \uC22B\uC790 ID\uB294 txid\uC778\uC9C0 withdrawal_id\uC778\uC9C0 \uAC12\uB9CC\uC73C\uB85C \uAD6C\uBD84\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C(KRW\uB294 \uB458 \uB2E4 \uC22B\uC790), txid\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 withdraw_not_found\uBA74 \uAC19\uC740 \uAC12\uC744 withdrawal_id\uB85C \uC7AC\uC2DC\uB3C4\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. A bare numeric ID is ambiguous (txid and withdrawal_id can both be numeric, esp. KRW) \u2014 query txid first; on withdraw_not_found, retry the same value as withdrawal_id before concluding 'not found'. Example call: {"currency":"BTC","txid":"2025-07-31 15:12:24.407715"}. For a bare numeric ID, try {"currency":"KRW","txid":"55955615"} first; on withdraw_not_found, retry {"currency":"KRW","withdrawal_id":"43007582"}.`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          withdrawal_id: {
            type: "string",
            description: "Withdrawal unique ID"
          },
          txid: {
            type: "string",
            description: "Withdrawal transaction ID"
          }
        },
        required: ["currency"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/withdraw",
          compactObject({
            currency: requireString(args, "currency"),
            uuid: readString(args, "withdrawal_id"),
            txid: readString(args, "txid")
          }),
          privateRateLimit("withdraw_get")
        );
        return normalizeResponse(response);
      }
    },
    // ── 11. withdraw_get_list ────────────────────────────────────────
    {
      name: "withdraw_get_list",
      module: "withdraw",
      description: `\uC5EC\uB7EC \uCD9C\uAE08\uC744 \uAC80\uC0C9\uD558\uAC70\uB098 \uC0C1\uD0DC\uB85C \uAC70\uB978 \uB9AC\uC2A4\uD2B8\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. \uC2DD\uBCC4\uC790\uAC00 1\uAC1C\uBFD0\uC774\uBA74 withdraw_get(\uB2E8\uAC74)\uC744 \uC4F0\uC138\uC694. List of coin withdrawals (table-rendered; same fields as withdraw_get). Use when: 'recent withdrawals' / filter by state / search across multiple txids. Do NOT use: when you have a single txid or withdrawal_id \u2014 use withdraw_get instead. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uB9AC\uC2A4\uD2B8 \uAC80\uC0C9 \uC2DC): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. ID\uAC00 txid\uC778\uC9C0 uuid(withdrawal_ids)\uC778\uC9C0 \uBD88\uBA85\uD655\uD558\uBA74 txids\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 \uBE48 \uBC30\uC5F4\uC774\uBA74 \uAC19\uC740 \uAC12\uC744 withdrawal_ids\uB85C \uC7AC\uC2DC\uB3C4(\uB610\uB294 \uC0AC\uC6A9\uC790 \uC9C8\uBB38)\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. If a txids search returns an empty array, the value may be a withdrawal_id \u2014 retry the same values via withdrawal_ids (or ask the user) before concluding 'not found'. \u26A0\uFE0F \uACF5\uBC31\xB7\uC27C\uD45C \uD3EC\uD568 txid \uC81C\uC57D: \uBE57\uC378 \uBAA9\uB85D \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uC758 txids \uD544\uD130\uB294 \uAC12\uC5D0 \uACF5\uBC31\uC774\uB098 \uC27C\uD45C\uAC00 \uC788\uC73C\uBA74(\uC62C\uBC14\uB85C percent-encode\uD574\uB3C4) \uB9E4\uCE6D\uD558\uC9C0 \uBABB\uD55C\uB2E4(\uC11C\uBC84 \uC81C\uC57D). \uADF8\uB7F0 txid(\uC608: 'EVENT_COUPON:4,649', '2025-08-04 20:33:13.452665')\uB294 txids\uB85C \uC870\uD68C\uD558\uC9C0 \uB9D0\uACE0 withdraw_get \uB2E8\uAC74(txid)\uC73C\uB85C \uC870\uD68C\uD558\uB77C. A txid containing a space or comma cannot be matched by the list txids filter (server-side limitation, even when correctly encoded) \u2014 use the single-record withdraw_get with \`txid\` instead. Example call (txid lookup): {"currency":"TRX","txids":["17d829e8..."]}`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          state: {
            type: "string",
            enum: ["PROCESSING", "DONE", "CANCELLED"],
            description: "Withdrawal state filter"
          },
          withdrawal_ids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by withdrawal IDs (uuids). Fallback identifier: if a txids lookup returned an empty array for a bare numeric ID, retry that value here (KRW uuids and txids are both numeric, so the value is ambiguous)."
          },
          txids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by transaction IDs (primary identifier for withdrawals). A bare numeric ID may be a withdrawal_id (esp. KRW, where uuids and txids are both numeric) \u2014 if this returns an empty array, retry the same value via withdrawal_ids before concluding 'not found'."
          },
          limit: {
            type: "number",
            description: "Number of results per page (max 100)"
          },
          page: {
            type: "number",
            description: "Page number"
          },
          order_by: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order (default: desc)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/withdraws",
          compactObject({
            currency: readString(args, "currency"),
            state: readString(args, "state"),
            uuids: readStringArray(args, "withdrawal_ids"),
            txids: readStringArray(args, "txids"),
            limit: readNumber(args, "limit"),
            page: readNumber(args, "page"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("withdraw_get_list")
        );
        return normalizeResponse(response);
      }
    },
    // ── 12. withdraw_get_list_krw ────────────────────────────────────
    {
      name: "withdraw_get_list_krw",
      module: "withdraw",
      description: `\uC6D0\uD654 \uCD9C\uAE08 \uB9AC\uC2A4\uD2B8\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get list of KRW withdrawals. Use when: user asks 'recent KRW withdrawals' / filter by state or withdrawal_id. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uC911\uC694): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. KRW\uC758 txids\uC640 withdrawal_ids(uuids)\uB294 \uB458 \uB2E4 \uC22B\uC790\uB77C \uAC12\uB9CC\uC73C\uB85C \uAD6C\uBD84\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C, \uC0AC\uC6A9\uC790\uAC00 \uB9E8 \uC22B\uC790 ID\uB97C \uC8FC\uBA74 txids\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 \uBE48 \uBC30\uC5F4\uC774\uBA74 \uAC19\uC740 \uAC12\uC744 withdrawal_ids\uB85C \uC7AC\uC2DC\uB3C4(\uB610\uB294 \uC0AC\uC6A9\uC790\uC5D0\uAC8C withdrawal_ids\uB85C \uC870\uD68C\uD560\uC9C0 \uC9C8\uBB38)\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. Both txids and withdrawal_ids are numeric for KRW, so a bare number is ambiguous \u2014 if the txids filter returns an empty array, retry the same values via withdrawal_ids (or ask the user) before concluding 'not found'. Example call: {"state":"DONE","limit":10}. For a bare numeric ID, try {"txids":["55955615"]} first; if it returns [], retry {"withdrawal_ids":["43007582"]}.`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          state: {
            type: "string",
            enum: ["PROCESSING", "DONE", "CANCELLED"],
            description: "Withdrawal state filter"
          },
          withdrawal_ids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by withdrawal IDs (uuids). Fallback identifier: if a txids lookup returned an empty array for a bare numeric ID, retry that value here (KRW uuids and txids are both numeric, so the value is ambiguous)."
          },
          txids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by transaction IDs (primary identifier for withdrawals). A bare numeric ID may be a withdrawal_id (esp. KRW, where uuids and txids are both numeric) \u2014 if this returns an empty array, retry the same value via withdrawal_ids before concluding 'not found'."
          },
          limit: {
            type: "number",
            description: "Number of results per page (max 100)"
          },
          page: {
            type: "number",
            description: "Page number"
          },
          order_by: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order (default: desc)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/withdraws/krw",
          compactObject({
            state: readString(args, "state"),
            uuids: readStringArray(args, "withdrawal_ids"),
            txids: readStringArray(args, "txids"),
            limit: readNumber(args, "limit"),
            page: readNumber(args, "page"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("withdraw_get_list_krw")
        );
        return normalizeResponse(response);
      }
    },
    // ── 13. withdraw_coin ────────────────────────────────────────────
    {
      name: "withdraw_coin",
      module: "withdraw",
      description: "\uC2E4\uC81C \uAC00\uC0C1 \uC790\uC0B0\uC744 \uCD9C\uAE08\uD569\uB2C8\uB2E4. \uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. Withdraw cryptocurrency. This action is IRREVERSIBLE. Use when: user has explicitly approved a withdrawal AND the full pre-flight checklist has run (account_get_assets, account_get_wallet_status, withdraw_get_chance, withdraw_get_addresses, market_get_fee_inout). Do NOT use: without prior `withdraw_get_chance` to confirm net_type/min/fee; without `withdraw_get_addresses` to confirm destination is in the allow-list; without explicit user confirmation of the full destination string. Multi-network coins (USDT/USDC/XRP): always run `withdraw_get_chance` first to discover supported `net_type`. Wrong net_type = permanent loss. secondary_address (memo/tag): mandatory for XRP/EOS/ATOM-class coins. Missing it = lost funds. Withdrawal types: internal member-to-member withdrawals do not need exchange_name; external withdrawals (CODE ID Connect, CODE personal, CODE corporation, WHITELIST) require exchange_name. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          net_type: {
            type: "string",
            description: "Withdrawal network, e.g. BTC, DASH"
          },
          amount: {
            type: "string",
            description: "Withdrawal amount"
          },
          address: {
            type: "string",
            description: "Registered withdrawal address"
          },
          secondary_address: {
            type: "string",
            description: "Secondary address / memo / tag. Required when the asset/network requires a secondary destination identifier (for example XRP Destination Tag), regardless of withdrawal type."
          },
          exchange_name: {
            type: "string",
            description: "Destination exchange/wallet name (English). Required for external withdrawal types: CODE ID Connect, CODE personal, CODE corporation, WHITELIST. Do not send for internal member-to-member withdrawals. By itself it does NOT trigger receiver-info validation \u2014 the trigger is receiver_type."
          },
          receiver_type: {
            type: "string",
            enum: ["personal", "corporation"],
            description: "Receiver type: personal or corporation. Use only for CODE personal/corporation withdrawals; omit for internal, CODE ID Connect, and WHITELIST."
          },
          receiver_ko_name: {
            type: "string",
            description: "Receiver Korean name. personal: \uAC1C\uC778 \uAD6D\uBB38\uBA85; corporation: \uB300\uD45C\uC790 \uAD6D\uBB38\uBA85 (required for both when receiver_type is set)"
          },
          receiver_en_name: {
            type: "string",
            description: "Receiver English name. personal: \uAC1C\uC778 \uC601\uBB38\uBA85; corporation: \uB300\uD45C\uC790 \uC601\uBB38\uBA85 (required for both when receiver_type is set)"
          },
          receiver_corp_ko_name: {
            type: "string",
            description: "Corporation Korean name (required if corporation)"
          },
          receiver_corp_en_name: {
            type: "string",
            description: "Corporation English name (required if corporation)"
          }
        },
        required: ["currency", "net_type", "amount", "address"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const receiverType = readString(args, "receiver_type");
        if (receiverType !== void 0 && receiverType !== "personal" && receiverType !== "corporation") {
          throw new ValidationError(
            `Invalid receiver_type: ${receiverType}.`,
            "receiver_type only accepts the lowercase strings 'personal' or 'corporation'."
          );
        }
        if (receiverType === "personal") {
          const missing = ["receiver_ko_name", "receiver_en_name"].filter((field) => !readString(args, field));
          if (missing.length > 0) {
            throw new ValidationError(
              `Missing required receiver info for personal receiver: ${missing.join(", ")}.`,
              "Travel Rule requires both receiver_ko_name (\uAD6D\uBB38 \uC131\uBA85) and receiver_en_name (\uC601\uBB38 \uC131\uBA85) when receiver_type is personal."
            );
          }
        } else if (receiverType === "corporation") {
          const missing = [
            "receiver_corp_ko_name",
            "receiver_corp_en_name",
            "receiver_ko_name",
            "receiver_en_name"
          ].filter((field) => !readString(args, field));
          if (missing.length > 0) {
            throw new ValidationError(
              `Missing required receiver info for corporation receiver: ${missing.join(", ")}.`,
              "Travel Rule requires corporation name (receiver_corp_ko_name/receiver_corp_en_name) and representative name (receiver_ko_name/receiver_en_name) when receiver_type is corporation."
            );
          }
        }
        const response = await context.client.privatePost(
          "/v1/withdraws/coin",
          compactObject({
            currency: requireString(args, "currency"),
            net_type: requireString(args, "net_type"),
            amount: requireString(args, "amount"),
            address: requireString(args, "address"),
            secondary_address: readString(args, "secondary_address"),
            exchange_name: readString(args, "exchange_name"),
            receiver_type: readString(args, "receiver_type"),
            receiver_ko_name: readString(args, "receiver_ko_name"),
            receiver_en_name: readString(args, "receiver_en_name"),
            receiver_corp_ko_name: readString(args, "receiver_corp_ko_name"),
            receiver_corp_en_name: readString(args, "receiver_corp_en_name")
          }),
          orderRateLimit("withdraw_coin")
        );
        return normalizeResponse(response);
      }
    },
    // ── 14. withdraw_krw ─────────────────────────────────────────────
    {
      name: "withdraw_krw",
      module: "withdraw",
      description: "\uB4F1\uB85D\uB41C \uACC4\uC88C\uB85C \uC6D0\uD654\uB97C \uCD9C\uAE08\uD569\uB2C8\uB2E4. \uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. 2\uCC28 \uC778\uC99D(\uCE74\uCE74\uC624)\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. Withdraw KRW to registered bank account. This action is IRREVERSIBLE. Requires 2FA (Kakao). \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the withdrawal amount and wait for explicit approval. Do NOT withdraw without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "Withdrawal amount in KRW"
          },
          two_factor_type: {
            type: "string",
            description: "2FA method (e.g. kakao)"
          }
        },
        required: ["amount", "two_factor_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v1/withdraws/krw",
          {
            amount: requireString(args, "amount"),
            two_factor_type: requireString(args, "two_factor_type")
          },
          orderRateLimit("withdraw_krw")
        );
        return normalizeResponse(response);
      }
    },
    // ── 15. withdraw_cancel_coin ─────────────────────────────────────
    {
      name: "withdraw_cancel_coin",
      module: "withdraw",
      description: "\uAC00\uC0C1 \uC790\uC0B0 \uCD9C\uAE08\uC744 \uCDE8\uC18C\uD569\uB2C8\uB2E4. Cancel a cryptocurrency withdrawal. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the withdrawal ID and wait for explicit approval. Do NOT cancel without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          withdrawal_id: {
            type: "string",
            description: "Withdrawal unique ID to cancel"
          }
        },
        required: ["withdrawal_id"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateDelete(
          "/v1/withdraws/coin",
          {
            withdrawal_id: requireString(args, "withdrawal_id")
          },
          orderRateLimit("withdraw_cancel_coin")
        );
        return normalizeResponse(response);
      }
    },
    // ── 16. withdraw_get_addresses ───────────────────────────────────
    {
      name: "withdraw_get_addresses",
      module: "withdraw",
      description: "\uCD9C\uAE08 \uD5C8\uC6A9 \uC8FC\uC18C \uB9AC\uC2A4\uD2B8\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get list of allowed withdrawal addresses.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v1/withdraws/coin_addresses",
          {},
          privateRateLimit("withdraw_get_addresses")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
function registerDepositTools() {
  return [
    // ── 17. deposit_get ───────────────────────────────────────────
    {
      name: "deposit_get",
      module: "deposit",
      description: `\uC2DD\uBCC4\uC790(txid \uB610\uB294 deposit_id) 1\uAC1C\uB85C \uD2B9\uC815 \uC785\uAE08 1\uAC74\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4. \uB2E8\uAC74 \uC870\uD68C\uC758 canonical \uB3C4\uAD6C. Single deposit by one identifier. Use when: you have one txid or deposit_id. Do NOT use: to search by state or multiple txids \u2014 use deposit_get_list instead. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uC911\uC694): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. \uB9E8 \uC22B\uC790 ID\uB294 txid\uC778\uC9C0 deposit_id\uC778\uC9C0 \uAC12\uB9CC\uC73C\uB85C \uAD6C\uBD84\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C(KRW\uBFD0 \uC544\uB2C8\uB77C \uCF54\uC778\uB3C4 deposit_id\uAC00 \uC22B\uC790\uC77C \uC218 \uC788\uC74C), txid\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 deposit_not_found\uBA74 \uAC19\uC740 \uAC12\uC744 deposit_id\uB85C \uC7AC\uC2DC\uB3C4\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. A bare numeric ID is ambiguous (txid and deposit_id can both be numeric, even for coins) \u2014 query txid first; on deposit_not_found, retry the same value as deposit_id before concluding 'not found'. Example call: {"currency":"BTC","txid":"2025-07-31 15:12:24.407715"}. For a bare numeric ID, try {"currency":"TRX","txid":"719812240"} first; on deposit_not_found, retry {"currency":"TRX","deposit_id":"719812240"}.`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          deposit_id: {
            type: "string",
            description: "Deposit ID"
          },
          txid: {
            type: "string",
            description: "Deposit TXID"
          }
        },
        required: ["currency"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/deposit",
          compactObject({
            currency: requireString(args, "currency"),
            uuid: readString(args, "deposit_id"),
            txid: readString(args, "txid")
          }),
          privateRateLimit("deposit_get")
        );
        return normalizeResponse(response);
      }
    },
    // ── 18. deposit_get_list ──────────────────────────────────────
    {
      name: "deposit_get_list",
      module: "deposit",
      description: `\uC5EC\uB7EC \uC785\uAE08\uC744 \uAC80\uC0C9\uD558\uAC70\uB098 \uC0C1\uD0DC\uB85C \uAC70\uB978 \uB9AC\uC2A4\uD2B8\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. \uC2DD\uBCC4\uC790\uAC00 1\uAC1C\uBFD0\uC774\uBA74 deposit_get(\uB2E8\uAC74)\uC744 \uC4F0\uC138\uC694. List of coin deposits (table-rendered; same fields as deposit_get). Use when: 'recent deposits' / filter by state / search across multiple txids. Do NOT use: when you have a single deposit_id or txid \u2014 use deposit_get instead. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uB9AC\uC2A4\uD2B8 \uAC80\uC0C9 \uC2DC): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. \uB9E8 \uC22B\uC790 ID\uB294 txid\uC778\uC9C0 deposit_id(deposit_ids)\uC778\uC9C0 \uAC12\uB9CC\uC73C\uB85C \uAD6C\uBD84\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C(KRW\uBFD0 \uC544\uB2C8\uB77C \uCF54\uC778\uB3C4 deposit_id\uAC00 \uC22B\uC790\uC77C \uC218 \uC788\uC74C), \uB9E8 \uC22B\uC790\uAC00 \uC8FC\uC5B4\uC9C0\uBA74 txids\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 \uBE48 \uBC30\uC5F4\uC774\uBA74 \uAC19\uC740 \uAC12\uC744 deposit_ids\uB85C \uC7AC\uC2DC\uB3C4(\uB610\uB294 \uC0AC\uC6A9\uC790 \uC9C8\uBB38)\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. A bare numeric ID is ambiguous (txid and deposit_id can both be numeric, even for coins) \u2014 search txids first; if it returns an empty array, retry the same values via deposit_ids (or ask the user) before concluding 'not found'. \u26A0\uFE0F \uACF5\uBC31\xB7\uC27C\uD45C \uD3EC\uD568 txid \uC81C\uC57D: \uBE57\uC378 \uBAA9\uB85D \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uC758 txids \uD544\uD130\uB294 \uAC12\uC5D0 \uACF5\uBC31\uC774\uB098 \uC27C\uD45C\uAC00 \uC788\uC73C\uBA74(\uC62C\uBC14\uB85C percent-encode\uD574\uB3C4) \uB9E4\uCE6D\uD558\uC9C0 \uBABB\uD55C\uB2E4(\uC11C\uBC84 \uC81C\uC57D). \uADF8\uB7F0 txid(\uC608: 'EVENT_COUPON:4,649', '2025-07-31 15:12:24.407715')\uB294 txids\uB85C \uC870\uD68C\uD558\uC9C0 \uB9D0\uACE0 deposit_get \uB2E8\uAC74(txid)\uC73C\uB85C \uC870\uD68C\uD558\uB77C. A txid containing a space or comma cannot be matched by the list txids filter (server-side limitation, even when correctly encoded) \u2014 use the single-record deposit_get with \`txid\` instead. Example call (txid lookup): {"txids":["0xabc123..."]}`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          state: {
            type: "string",
            enum: [
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
            ],
            description: "Coin deposit state filter (case-sensitive UPPERCASE). Covers request / deposit / refund-request / refund-payout phases."
          },
          deposit_ids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by deposit IDs (uuids). Fallback identifier: if a txids lookup returned an empty array for a bare numeric ID, retry that value here (KRW uuids and txids are both numeric, so the value is ambiguous)."
          },
          txids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by deposit TXIDs (primary identifier for deposits). A bare numeric ID may be a deposit_id (esp. KRW, where uuids and txids are both numeric) \u2014 if this returns an empty array, retry the same value via deposit_ids before concluding 'not found'."
          },
          limit: {
            type: "number",
            description: "Number of results (max 100)"
          },
          page: {
            type: "number",
            description: "Page number (default 1)"
          },
          order_by: {
            type: "string",
            description: "Sort order: asc or desc (default desc)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/deposits",
          compactObject({
            currency: readString(args, "currency"),
            state: readString(args, "state"),
            uuids: readStringArray(args, "deposit_ids"),
            txids: readStringArray(args, "txids"),
            limit: readNumber(args, "limit"),
            page: readNumber(args, "page"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("deposit_get_list")
        );
        return normalizeResponse(response);
      }
    },
    // ── 19. deposit_get_list_krw ──────────────────────────────────
    {
      name: "deposit_get_list_krw",
      module: "deposit",
      description: `\uC6D0\uD654 \uC785\uAE08 \uB9AC\uC2A4\uD2B8\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get list of KRW deposits. Use when: user asks 'recent KRW deposits' / filter by state or deposit_id. \uC2DD\uBCC4\uC790 \uD3F4\uBC31(\uC911\uC694): \uC785\xB7\uCD9C\uAE08\uC740 txid\uB97C 1\uCC28 \uC2DD\uBCC4\uC790\uB85C \uC4F4\uB2E4. KRW\uC758 txids\uC640 deposit_ids(uuids)\uB294 \uB458 \uB2E4 \uC22B\uC790\uB77C \uAC12\uB9CC\uC73C\uB85C \uAD6C\uBD84\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C, \uC0AC\uC6A9\uC790\uAC00 \uB9E8 \uC22B\uC790 ID\uB97C \uC8FC\uBA74 txids\uB85C \uBA3C\uC800 \uC870\uD68C \u2192 \uBE48 \uBC30\uC5F4\uC774\uBA74 \uAC19\uC740 \uAC12\uC744 deposit_ids\uB85C \uC7AC\uC2DC\uB3C4(\uB610\uB294 \uC0AC\uC6A9\uC790\uC5D0\uAC8C deposit_ids\uB85C \uC870\uD68C\uD560\uC9C0 \uC9C8\uBB38)\uD55C \uB4A4\uC5D0 '\uC5C6\uC74C'\uC73C\uB85C \uB2E8\uC815\uD558\uB77C. Both txids and deposit_ids are numeric for KRW, so a bare number is ambiguous \u2014 search txids first; if it returns an empty array, retry the same values via deposit_ids (or ask the user) before concluding 'not found'. Example call: {"state":"ACCEPTED","limit":10}. For a bare numeric ID, try {"txids":["1657265"]} first; if it returns [], retry {"deposit_ids":["405896908"]}.`,
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          state: {
            type: "string",
            enum: ["PROCESSING", "ACCEPTED", "CANCELLED"],
            description: "Deposit state: PROCESSING, ACCEPTED, CANCELLED"
          },
          deposit_ids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by deposit IDs (uuids). Fallback identifier: if a txids lookup returned an empty array for a bare numeric ID, retry that value here (KRW uuids and txids are both numeric, so the value is ambiguous)."
          },
          txids: {
            type: "array",
            items: { type: "string" },
            description: "Filter by deposit TXIDs (primary identifier for deposits). A bare numeric ID may be a deposit_id (esp. KRW, where uuids and txids are both numeric) \u2014 if this returns an empty array, retry the same value via deposit_ids before concluding 'not found'."
          },
          limit: {
            type: "number",
            description: "Number of results (max 100)"
          },
          page: {
            type: "number",
            description: "Page number (default 1)"
          },
          order_by: {
            type: "string",
            description: "Sort order: asc or desc (default desc)"
          }
        },
        required: []
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/deposits/krw",
          compactObject({
            state: readString(args, "state"),
            uuids: readStringArray(args, "deposit_ids"),
            txids: readStringArray(args, "txids"),
            limit: readNumber(args, "limit"),
            page: readNumber(args, "page"),
            order_by: readString(args, "order_by")
          }),
          privateRateLimit("deposit_get_list_krw")
        );
        return normalizeResponse(response);
      }
    },
    // ── 20. deposit_krw ──────────────────────────────────────────
    {
      name: "deposit_krw",
      module: "deposit",
      description: "\uC6D0\uD654 \uC785\uAE08\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4. 2\uCC28 \uC778\uC99D(\uCE74\uCE74\uC624)\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. Request KRW deposit. Requires 2FA (Kakao). \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the deposit amount and wait for explicit approval. Do NOT request deposit without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "Deposit amount in KRW"
          },
          two_factor_type: {
            type: "string",
            description: "2FA method, e.g. kakao"
          }
        },
        required: ["amount", "two_factor_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v1/deposits/krw",
          {
            amount: requireString(args, "amount"),
            two_factor_type: requireString(args, "two_factor_type")
          },
          privateRateLimit("deposit_krw")
        );
        return normalizeResponse(response);
      }
    },
    // ── 21. deposit_generate_address ─────────────────────────────
    {
      name: "deposit_generate_address",
      module: "deposit",
      description: "\uC785\uAE08 \uC8FC\uC18C\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4. Generate a new deposit address. \u26A0\uFE0F REQUIRES EXPLICIT USER CONFIRMATION before executing: show the user the currency and network type, then wait for explicit approval. Do NOT generate without user confirmation. CLI-first: when the Bithumb CLI is installed, prefer the documented `bithumb ...` CLI command for this write operation; use this MCP tool as fallback when the CLI is unavailable/fails or the user explicitly asks for MCP.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          net_type: {
            type: "string",
            description: "Network type, e.g. BTC, ETH"
          }
        },
        required: ["currency", "net_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/v1/deposits/generate_coin_address",
          {
            currency: requireString(args, "currency"),
            net_type: requireString(args, "net_type")
          },
          privateRateLimit("deposit_generate_address")
        );
        return normalizeResponse(response);
      }
    },
    // ── 22. deposit_get_addresses ────────────────────────────────
    {
      name: "deposit_get_addresses",
      module: "deposit",
      description: "\uC804\uCCB4 \uC785\uAE08 \uC8FC\uC18C\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get all deposit addresses. Use this first for multi-network coins (USDT, USDC, XRP, etc.) to discover available currency + net_type combinations before calling deposit_get_address.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/v1/deposits/coin_addresses",
          {},
          privateRateLimit("deposit_get_addresses")
        );
        return normalizeResponse(response);
      }
    },
    // ── 23. deposit_get_address ──────────────────────────────────
    {
      name: "deposit_get_address",
      module: "deposit",
      description: "\uAC1C\uBCC4 \uC785\uAE08 \uC8FC\uC18C\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4. Get deposit address for a specific currency and network. For multi-network coins (USDT, USDC, XRP, etc.), run deposit_get_addresses first to confirm the correct net_type \u2014 wrong network = permanent loss of funds.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "Currency symbol, e.g. BTC"
          },
          net_type: {
            type: "string",
            description: "Network type, e.g. BTC, ETH"
          }
        },
        required: ["currency", "net_type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/v1/deposits/coin_address",
          {
            currency: requireString(args, "currency"),
            net_type: requireString(args, "net_type")
          },
          privateRateLimit("deposit_get_address")
        );
        return normalizeResponse(response);
      }
    }
  ];
}
function allToolSpecs() {
  return [
    ...registerMarketTools(),
    ...registerAccountTools(),
    ...registerTradeTools(),
    ...registerAuditTools(),
    ...registerDiagnoseTools(),
    ...registerTwapTools(),
    ...registerWithdrawTools(),
    ...registerDepositTools()
  ];
}
function createToolRunner(client, config) {
  const tools = allToolSpecs();
  const toolMap = new Map(
    tools.map((t) => [t.name, t])
  );
  return async (toolName, args) => {
    const tool = toolMap.get(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    if (config.readOnly && tool.isWrite) {
      throw new Error(`'${toolName}' is a write operation and cannot be used in read-only mode.`);
    }
    return await tool.handler(args, { config, client });
  };
}
function configFilePath() {
  return join2(homedir2(), ".bithumb", "config.toml");
}
function readFullConfig() {
  const path2 = configFilePath();
  if (!existsSync2(path2)) return { profiles: {} };
  const raw = readFileSync(path2, "utf-8");
  try {
    return parse(raw);
  } catch (err) {
    throw new ConfigError(
      `Failed to parse ${path2}: ${err instanceof Error ? err.message : String(err)}`,
      "Check TOML syntax in your config file, or delete and re-create it."
    );
  }
}
function resolveEffectiveProfileName(config, profileName) {
  return profileName ?? config.default_profile ?? "default";
}
function readTomlProfile(profileName) {
  const config = readFullConfig();
  const name = resolveEffectiveProfileName(config, profileName);
  return config.profiles?.[name] ?? {};
}
var CONFIG_HEADER = "# Bithumb Trade Kit Configuration\n# Wrap values containing special chars in quotes\n\n";
function writeFullConfig(config, path2 = configFilePath()) {
  const dir = dirname(path2);
  if (!existsSync2(dir)) {
    mkdirSync(dir, { recursive: true, mode: 448 });
  }
  writeFileSync(
    path2,
    CONFIG_HEADER + stringify(config),
    { encoding: "utf-8", mode: 384 }
  );
  chmodSync(path2, 384);
}
var TIMEOUT_MIN = 1;
var TIMEOUT_MAX = 6e4;
function validateTimeoutMs(value) {
  if (!Number.isInteger(value) || value < TIMEOUT_MIN || value > TIMEOUT_MAX) {
    throw new ConfigError(
      "Invalid timeout.",
      `timeout_ms must be an integer between ${TIMEOUT_MIN} and ${TIMEOUT_MAX} (milliseconds).`
    );
  }
  return value;
}
var PROFILE_NAME_RE = /^[A-Za-z0-9._-]+$/;
function validateProfileName(name) {
  if (!PROFILE_NAME_RE.test(name)) {
    throw new ConfigError(
      `Invalid profile name: ${JSON.stringify(name)}.`,
      "A profile name may contain only letters, digits, '.', '_', and '-' (no spaces)."
    );
  }
  return name;
}
function loadConfig(options) {
  const toml = options?.ignoreToml ? {} : readTomlProfile(options?.profile);
  const profileExplicit = options?.profile !== void 0;
  const envAccessKey = process.env.BITHUMB_ACCESS_KEY?.trim();
  const envSecretKey = process.env.BITHUMB_SECRET_KEY?.trim();
  const tomlComplete = Boolean(toml.access_key && toml.secret_key);
  const envComplete = Boolean(envAccessKey && envSecretKey);
  const preferToml = profileExplicit ? tomlComplete : !envComplete;
  const accessKey = preferToml ? toml.access_key : envAccessKey;
  const secretKey = preferToml ? toml.secret_key : envSecretKey;
  const hasAuth = Boolean(accessKey && secretKey);
  const anyKeyPresent = Boolean(envAccessKey || envSecretKey || toml.access_key || toml.secret_key);
  if (anyKeyPresent && !hasAuth) {
    throw new ConfigError(
      "Partial API credentials.",
      "Set both BITHUMB_ACCESS_KEY and BITHUMB_SECRET_KEY (env vars or config.toml profile)."
    );
  }
  const baseUrl = (process.env.BITHUMB_API_BASE_URL?.trim() ?? toml.base_url ?? BITHUMB_API_BASE_URL).replace(/\/+$/, "");
  const rawTimeout = process.env.BITHUMB_TIMEOUT_MS ? Number(process.env.BITHUMB_TIMEOUT_MS) : toml.timeout_ms ?? 3e4;
  const timeoutMs = validateTimeoutMs(rawTimeout);
  let modules = [...DEFAULT_MODULES];
  if (options?.modules) {
    const requested = options.modules.split(",").map((s) => s.trim()).filter(Boolean);
    if (requested.length > 0) {
      let isAll = false;
      for (const m of requested) {
        if (m === "all") {
          modules = [...MODULES];
          isAll = true;
          break;
        }
        if (!MODULES.includes(m)) {
          throw new ConfigError(
            `Unknown module "${m}".`,
            `Use: ${MODULES.join(", ")} or "all".`
          );
        }
      }
      if (!isAll) modules = requested;
    }
  }
  if (toml.read_only !== void 0 && typeof toml.read_only !== "boolean") {
    throw new ConfigError(
      "Invalid read_only.",
      "config.toml profile read_only must be a boolean (true or false), not a string or number."
    );
  }
  return {
    accessKey,
    secretKey,
    hasAuth,
    baseUrl,
    timeoutMs,
    modules,
    readOnly: options?.readOnly ?? toml.read_only ?? false,
    verbose: options?.verbose ?? false,
    clientType: options?.clientType ?? "etc"
  };
}
var LEVEL_ORDER = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
var SENSITIVE_KEY_PATTERN = /accessKey|secretKey|password|secret|token|jwt/i;
function redactSensitive(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = "***REDACTED***";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
function todayDateString() {
  const d = /* @__PURE__ */ new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
var TradeLogger = class {
  logDir;
  minLevel;
  verbose;
  emitToStderr;
  constructor(minLevelOrOptions) {
    if (typeof minLevelOrOptions === "string") {
      this.logDir = join3(homedir3(), ".bithumb", "logs");
      this.minLevel = minLevelOrOptions;
      this.verbose = false;
      this.emitToStderr = true;
    } else {
      this.logDir = minLevelOrOptions?.logDir ?? join3(homedir3(), ".bithumb", "logs");
      this.minLevel = minLevelOrOptions?.minLevel ?? "info";
      this.verbose = minLevelOrOptions?.verbose ?? false;
      this.emitToStderr = minLevelOrOptions?.emitToStderr ?? true;
    }
    try {
      mkdirSync2(this.logDir, { recursive: true, mode: 448 });
    } catch {
    }
  }
  debug(message, meta) {
    this.log("debug", message, meta);
  }
  info(message, meta) {
    this.log("info", message, meta);
  }
  warn(message, meta) {
    this.log("warn", message, meta);
  }
  error(message, meta) {
    this.log("error", message, meta);
  }
  /** Log a tool invocation result (used by MCP server). */
  logTool(level, toolName, args, result, elapsedMs) {
    this.log(level, `tool:${toolName}`, {
      args,
      result,
      elapsedMs
    });
  }
  log(level, message, meta) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const entry = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      message,
      ...meta ? redactSensitive(meta) : {}
    };
    const line = JSON.stringify(entry);
    if (this.emitToStderr && (this.verbose || level === "error")) {
      process.stderr.write(`[${level}] ${message}
`);
    }
    try {
      const filePath = join3(this.logDir, `trade-${todayDateString()}.log`);
      const existed = existsSync3(filePath);
      appendFileSync(filePath, line + "\n", { encoding: "utf8", mode: 384 });
      if (!existed) chmodSync2(filePath, 384);
    } catch {
    }
  }
};
var CACHE_DIR = join4(homedir4(), ".bithumb");
var CACHE_FILE = join4(CACHE_DIR, "update-check.json");
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function isNewerVersion(current, latest) {
  const parse2 = (v) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const cur = parse2(current);
  const lat = parse2(latest);
  for (let i = 0; i < Math.max(cur.length, lat.length); i++) {
    const c = cur[i] ?? 0;
    const l = lat[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
async function fetchDistTags(packageName) {
  try {
    const url = `https://registry.npmjs.org/-/package/${encodeURIComponent(packageName)}/dist-tags`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5e3) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function fetchLatestVersion(packageName) {
  const tags = await fetchDistTags(packageName);
  return tags?.latest ?? null;
}
function readCache() {
  try {
    if (!existsSync4(CACHE_FILE)) return null;
    const raw = readFileSync2(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeCache(data) {
  try {
    if (!existsSync4(CACHE_DIR)) {
      mkdirSync3(CACHE_DIR, { recursive: true });
    }
    writeFileSync2(CACHE_FILE, JSON.stringify(data), "utf8");
  } catch {
  }
}
function isCacheStale(cache) {
  return Date.now() - cache.checkedAt > CACHE_TTL_MS;
}
function checkForUpdates(packageName, currentVersion) {
  try {
    const cache = readCache();
    if (cache && !isCacheStale(cache)) {
      if (isNewerVersion(currentVersion, cache.latestVersion)) {
        process.stderr.write(
          `
Update available: ${currentVersion} \u2192 ${cache.latestVersion}
Run: npm install -g ${packageName}

`
        );
      }
      return;
    }
    setImmediate(() => {
      fetchLatestVersion(packageName).then((latest) => {
        if (latest) {
          writeCache({ latestVersion: latest, checkedAt: Date.now() });
          if (isNewerVersion(currentVersion, latest)) {
            process.stderr.write(
              `
Update available: ${currentVersion} \u2192 ${latest}
Run: npm install -g ${packageName}

`
            );
          }
        }
      }).catch(() => {
      });
    });
  } catch {
  }
}

export {
  ConfigError,
  BithumbApiError,
  BithumbRestClient,
  createToolRunner,
  configFilePath,
  readFullConfig,
  resolveEffectiveProfileName,
  writeFullConfig,
  validateTimeoutMs,
  validateProfileName,
  loadConfig,
  TradeLogger,
  checkForUpdates
};
/*! Bundled license information:

smol-toml/dist/error.js:
smol-toml/dist/util.js:
smol-toml/dist/date.js:
smol-toml/dist/primitive.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=chunk-Y64A2CTR.js.map