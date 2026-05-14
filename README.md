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
- Tools: set of pre-defined operations callable by MCP clients, see Tools section below for details 
- Session-aware ConfD JSON-RPC integration with cookie-based authentication

## Tool

- [ping](./docs/tools/ping.md)
- [login](./docs/tools/login.md)
- [logout](./docs/tools/logout.md)
- [get_trans](./docs/tools/get_trans.md)
- [new_trans](./docs/tools/new_trans.md)
- [delete_trans](./docs/tools/delete_trans.md)
- [get_module_prefix_map](./docs/tools/get_module_prefix_map.md)
- [get_schema](./docs/tools/get_schema.md)

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
