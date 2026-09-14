#!/usr/bin/env node

// src/help/config.ts
var MODULE_HELP = `
Usage: bithumb config <command> [options]

Commands:
  show                             Show current configuration
  init                             Create config file (interactive)
  set                              Set a config value, or run the profile wizard with no args
  add-profile                      Add a new profile (interactive; name optional)
  list-profiles                    List all profiles
  use                              Set default profile
  path                             Show config file path

Options:
  --profile <name>   Target profile (default: current default)

Examples:
  bithumb config init
  bithumb config set                          # wizard: edit current profile
  bithumb config set access_key your_key --profile trading
  bithumb config add-profile trading          # wizard: create new profile
  bithumb config use trading
  bithumb config list-profiles
`;
var SHOW_HELP = `
Usage: bithumb config show [options]

Show the current configuration, including each profile's read_only setting.
The effective profile (--profile, else default_profile, else "default") is
marked. A profile that leaves read_only unset allows writes.

Required:
  (none)

Options:
  --profile <name>   Show only that profile's settings (no full dump)

Examples:
  bithumb config show
  bithumb config show --profile trading
  bithumb config show --profile trading --json
`;
var INIT_HELP = `
Usage: bithumb config init

Create a new config file interactively.

You will be prompted for:
  - Profile name (default: "default")
  - Access key
  - Secret key
  - Read-only mode (y/N)

The config file is written to the standard config path. If a config file
already exists, init exits without overwriting; use 'config add-profile' to
add a new profile, or 'config set' to update the current profile.

Required:
  (none \u2014 prompts run interactively on stdin)

Options:
  (none)

Examples:
  bithumb config init
`;
var SET_HELP = `
Usage: bithumb config set [<key> <value>] [options]

Two modes depending on whether arguments are given:

  Pinpoint (with <key> <value>):
    Set a single configuration value for a profile.
    Allowed keys: access_key, secret_key, timeout_ms, read_only

  Wizard (no arguments):
    Interactively update the target profile's access_key, secret_key,
    read-only mode, and timeout_ms. Fields that already have a value show a
    masked hint; pressing Enter keeps the existing value. Use this to change
    only some settings without retyping the rest.

Options:
  --profile <name>   Target profile (default: current default profile)

Examples:
  bithumb config set                          # wizard for current profile
  bithumb config set --profile trading        # wizard for 'trading'
  bithumb config set access_key your_key
  bithumb config set secret_key your_secret --profile trading
  bithumb config set timeout_ms 5000
  bithumb config set read_only true
`;
var ADD_PROFILE_HELP = `
Usage: bithumb config add-profile [<name>]

Add a new profile interactively. With a name argument the profile is created
under that name; without one you are prompted for the name first. Either way
you are then prompted for the access key, secret key, and read-only mode.
Fails if the name is empty or a profile with that name already exists.

Optional arguments:
  <name>             Profile name to create (prompted for if omitted)

Options:
  (none)

Examples:
  bithumb config add-profile                  # wizard: prompts for name too
  bithumb config add-profile trading
  bithumb config add-profile staging
`;
var LIST_PROFILES_HELP = `
Usage: bithumb config list-profiles

List all configured profiles.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb config list-profiles
  bithumb config list-profiles --json
`;
var USE_HELP = `
Usage: bithumb config use <name>

Set the default profile used when --profile is not specified.

Required arguments:
  <name>             Profile name to mark as default

Options:
  (none)

Examples:
  bithumb config use trading
  bithumb config use default
`;
var PATH_HELP = `
Usage: bithumb config path

Show the absolute path of the config file used by the CLI.

Required:
  (none)

Options:
  (none)

Examples:
  bithumb config path
`;
var ACTION_HELP = {
  show: SHOW_HELP,
  init: INIT_HELP,
  set: SET_HELP,
  "add-profile": ADD_PROFILE_HELP,
  "list-profiles": LIST_PROFILES_HELP,
  use: USE_HELP,
  path: PATH_HELP
};
export {
  ACTION_HELP,
  MODULE_HELP
};
//# sourceMappingURL=config-UCV76BDH.js.map