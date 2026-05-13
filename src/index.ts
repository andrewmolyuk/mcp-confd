#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function ping(): string {
	return "pong";
}

export function createServer(): McpServer {
	const server = new McpServer({
		name: "mcp-confd",
		version: "0.0.1",
	});

	server.tool("ping", "Basic health-check endpoint", () => {
		return {
			content: [{ type: "text", text: ping() }],
		};
	});

	return server;
}

export async function startServer(): Promise<void> {
	const server = createServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

export function isMainModule(importMetaUrl: string, argvPath?: string): boolean {
	if (typeof argvPath !== "string") {
		return false;
	}

	try {
		return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(argvPath);
	} catch {
		return false;
	}
}

const isEntrypoint = isMainModule(import.meta.url, process.argv[1]);

if (isEntrypoint) {
	await startServer();
}