# @bithumb-official/bithumb-cli

Terminal CLI for the Bithumb exchange. Run market data queries, account lookups, orders, TWAP orders, deposits, and withdrawals from the command line — no code required.

## Install

Requires Node.js 18 or later.

```bash
npm install -g @bithumb-official/bithumb-cli
bithumb --version
```

## Quick Start

Market data works without API credentials:

```bash
bithumb market ticker KRW-BTC
bithumb market orderbook KRW-ETH
bithumb market candles-days KRW-BTC --count 30
```

Account, trade, deposit, and withdraw commands require an API key. See [Authentication](#authentication) to set one up.

```bash
bithumb account assets
bithumb trade place --market KRW-BTC --side bid --order-type limit --price 50000000 --volume 0.001
bithumb twap place --market KRW-BTC --side bid --duration 3600 --frequency 60 --price 50000000
bithumb system diagnose
```

## Authentication

Set up an API Key with the required permissions on the [Bithumb API management page](https://www.bithumb.com/react/api-support/management-api).

**Environment variables:**

```bash
export BITHUMB_ACCESS_KEY="your_access_key"
export BITHUMB_SECRET_KEY="your_secret_key"
```

Add to `~/.zshrc` or `~/.bashrc` for permanent use.

**Config file** — store multiple profiles in `~/.bithumb/config.toml`:

```bash
bithumb config init              # create config interactively
bithumb config add-profile
bithumb config use trading
```

Environment variables take precedence over the config file unless `--profile` is specified.

## Modules

| Module | Commands | Auth required |
|---|---|:---:|
| `market` | markets, ticker, orderbook, candles-minutes, candles-days, candles-weeks, candles-months, trades, fee-inout, notices, warnings | No |
| `account` | assets, order-chance, wallet-status, api-keys | Yes |
| `trade` | place, cancel, get, list, batch-place, batch-cancel | Yes |
| `twap` | place, cancel, list | Yes |
| `deposit` | list, get, address, addresses, generate-address, list-krw, krw | Yes |
| `withdraw` | list, get, chance, addresses, coin, cancel, list-krw, krw | Yes |

**Utility modules**

| Module | Commands | Auth required |
|---|---|:---:|
| `system` | diagnose, audit | No |
| `config` | show, init, set, add-profile, list-profiles, use, path | No |

Run `bithumb <module> --help` for full options.

## Global Options

| Option | Description |
|---|---|
| `--json` | Output raw JSON response |
| `--verbose` | Enable detailed request logging |
| `--profile <name>` | Use a named config.toml profile |
| `--version`, `-v` | Print version |
| `--help`, `-h` | Print help |

## Documentation

For more details, see the [CLI guide](https://apidocs.bithumb.com/docs/cli).

## Related

- **MCP server**: [@bithumb-official/bithumb-mcp](https://www.npmjs.com/package/@bithumb-official/bithumb-mcp)
- **Skills**: [bithumb-official/bithumb-ai-trade-kit](https://github.com/bithumb-official/bithumb-ai-trade-kit)

## License

MIT
