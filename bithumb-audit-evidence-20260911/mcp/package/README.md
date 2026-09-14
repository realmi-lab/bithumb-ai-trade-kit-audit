
# @bithumb-official/bithumb-mcp

MCP (Model Context Protocol) server for the Bithumb exchange. Connect Claude, Cursor, VS Code, Windsurf, Codex, and other MCP-compatible clients to Bithumb — query market data, manage orders, and handle deposits and withdrawals using natural language.

Runs locally via `npx`. API keys and request data go directly to the Bithumb API without passing through any external server.

## Quick Start

Requires Node.js 18 or later. No global install needed — the server runs automatically via `npx`.

To use features that require authentication, set environment variables first — see [Authentication](#authentication).

**Claude Code** (`.mcp.json` in project root, or `~/.claude.json` for global):

```json
{
  "mcpServers": {
    "bithumb": {
      "command": "npx",
      "args": ["-y", "@bithumb-official/bithumb-mcp", "--modules", "all"],
      "env": {
        "BITHUMB_ACCESS_KEY": "${BITHUMB_ACCESS_KEY}",
        "BITHUMB_SECRET_KEY": "${BITHUMB_SECRET_KEY}"
      }
    }
  }
}
```

Save and restart the client. For more details, see the [MCP guide](https://apidocs.bithumb.com/docs/mcp).

## Authentication

Market data tools work without credentials. Account, trade, deposit, and withdraw tools require a Bithumb API key.

Set up an API Key with the required permissions on the [Bithumb API management page](https://www.bithumb.com/react/api-support/management-api), then set environment variables:

```bash
export BITHUMB_ACCESS_KEY="your_access_key"
export BITHUMB_SECRET_KEY="your_secret_key"
```

Add to `~/.zshrc` or `~/.bashrc` for permanent use. The MCP server reads environment variables only — it does not use `~/.bithumb/config.toml` profiles.

## Tools

| Module | Auth required |
|---|:---:|
| Market — markets, ticker, orderbook, candles, trades, deposit/withdrawal fees, notices, warnings | No |
| Account — assets, order chance, wallet status, API keys | Yes |
| Trade — place, cancel, get, list, batch place/cancel | Yes |
| TWAP — place, cancel, get orders | Yes |
| Deposit — get, list, list KRW, address, addresses, generate address, KRW deposit | Yes |
| Withdraw — get, list, list KRW, chance, addresses, coin, cancel, KRW | Yes |
| System — diagnose, audit log | No |

## Server Options

Options go in the `args` array of your client config:

```json
"args": ["-y", "@bithumb-official/bithumb-mcp", "--modules", "market,account", "--read-only"]
```

| Option | Description | Default |
|---|---|---|
| `--modules <list>` | Comma-separated modules to enable, or `all` | `all` |
| `--read-only` | Disable order and withdrawal tools | `false` |
| `--no-log` | Disable audit logging | logging enabled |
| `--log-level <level>` | `error`, `warn`, `info`, `debug` | `info` |
| `--verbose` | Print detailed request logs to stderr | `false` |
| `--version` | Print version | |
| `--help` | Print help | |

## Documentation

For more details, see the [MCP guide](https://apidocs.bithumb.com/docs/mcp).

## Related

- **CLI**: [@bithumb-official/bithumb-cli](https://www.npmjs.com/package/@bithumb-official/bithumb-cli)
- **Skills**: [bithumb-official/bithumb-ai-trade-kit](https://github.com/bithumb-official/bithumb-ai-trade-kit)

## License

MIT
