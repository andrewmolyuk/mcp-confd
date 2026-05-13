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
- Single tool: ping

## Development

Install dependencies:

make install

Run tests:

make test

Build:

make build

Run server:

node dist/index.js

## Tool

ping:

- Input: none
- Output: text "pong"
