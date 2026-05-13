import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function ping(): string {
	return "pong";
}

export function registerPingTool(server: McpServer): void {
	server.tool("ping", "Basic health-check endpoint", () => {
		return {
			content: [{ type: "text", text: ping() }],
		};
	});
}
