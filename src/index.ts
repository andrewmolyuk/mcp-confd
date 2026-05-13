import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";

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

const isEntrypoint =
	typeof process.argv[1] === "string" &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
	await startServer();
}