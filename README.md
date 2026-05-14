# mcp-confd

[![Build Status](https://github.com/andrewmolyuk/mcp-confd/actions/workflows/test.yml/badge.svg)](https://github.com/andrewmolyuk/mcp-confd/actions/workflows/test.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/c224f40b5d1e4f31bd4dcd129cecbd49)](https://app.codacy.com/gh/andrewmolyuk/mcp-confd/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/c224f40b5d1e4f31bd4dcd129cecbd49)](https://app.codacy.com/gh/andrewmolyuk/mcp-confd/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Issues](https://img.shields.io/github/issues/andrewmolyuk/mcp-confd)](https://github.com/andrewmolyuk/mcp-confd/issues)
[![NPM downloads](https://img.shields.io/npm/dw/mcp-confd.svg?style=flat)](https://www.npmjs.com/package/mcp-confd)
[![semantic-release: conventional](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

Basic MCP server skeleton for ConfD integration.

## Features

- MCP server over stdio
- Tools: ping, login, logout, get_trans, new_trans, delete_trans
- Session-aware ConfD JSON-RPC integration with cookie-based authentication

## Tool Behavior Notes

- [`ping`](./docs/tools/ping.md): Basic health check, returns `pong`.
- [`login`](./docs/tools/login.md): Calls ConfD `login`, stores `sessionid` cookie from `Set-Cookie`, returns session/challenge fields.
- [`logout`](./docs/tools/logout.md): If no local session is set, returns `{}` without RPC call. If a session exists, calls ConfD `logout`, clears local cookie, and propagates ConfD errors.
- [`get_trans`](./docs/tools/get_trans.md): Calls ConfD `get_trans` and returns transaction list. If there are no open transactions, returns an empty `trans` array. If session is missing/invalid, propagates ConfD session errors.
- [`new_trans`](./docs/tools/new_trans.md): Requires an active local session cookie. Fails fast with a helpful error when no session is active.
- [`delete_trans`](./docs/tools/delete_trans.md): Requires an active local session cookie. Fails fast with a helpful error when no session is active.

## ConfD Configuration

The tools call the ConfD JSON-RPC endpoint configured by:

- `MCP_CONFD_URL`

Defaults:

- `MCP_CONFD_URL=http://127.0.0.1:8008/jsonrpc`

Supported environment variables:

- `MCP_CONFD_URL` (`http://...` or `https://...`)
- `MCP_CONFD_USER`
- `MCP_CONFD_PASSWORD`
- `MCP_CONFD_IGNORE_SSL_ERRORS` (`true`/`1`/`yes` to skip TLS cert validation for self-signed HTTPS)

## Development

Install dependencies:

make install

Run tests:

make test

Build:

make build

Run server:

node dist/index.js
