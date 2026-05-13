#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerTools } from "./register.js";

function getPackageVersion(): string {
	try {
		const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
			version?: string;
		};
		return packageJson.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

const SERVER_VERSION = getPackageVersion();

export function createServer(): McpServer {
	const server = new McpServer({
		name: "mcp-confd",
		version: SERVER_VERSION,
	});

	registerTools(server);

	return server;
}

export async function startServer(): Promise<void> {
	const server = createServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

function isMainModule(importMetaUrl: string, argvPath?: string): boolean {
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