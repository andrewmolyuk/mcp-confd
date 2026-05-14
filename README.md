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
- Tools: ping, login, logout

## Development

Install dependencies:

make install

Run tests:

make test

Build:

make build

Run server:

node dist/index.js

## Tools

See tool documentation in [docs/tools/README.md](docs/tools/README.md).

## ConfD Configuration

The login flow targets ConfD JSON-RPC endpoint:

- `$MCP_CONFD_PROTOCOL://$MCP_CONFD_HOST:$MCP_CONFD_PORT/jsonrpc`

Defaults:

- `MCP_CONFD_PROTOCOL=http`
- `MCP_CONFD_HOST=127.0.0.1`
- `MCP_CONFD_PORT=8008`

Supported environment variables:

- `MCP_CONFD_PROTOCOL` (`http` or `https`)
- `MCP_CONFD_HOST`
- `MCP_CONFD_PORT`
- `MCP_CONFD_USER`
- `MCP_CONFD_PASSWORD`
- `MCP_CONFD_IGNORE_SSL_ERRORS` (`true`/`1`/`yes` to skip TLS cert validation for self-signed HTTPS)
