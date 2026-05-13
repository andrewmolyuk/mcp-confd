import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLoginTool } from "./tools/login.js";
import { registerPingTool } from "./tools/ping.js";

export function registerTools(server: McpServer): void {
	registerPingTool(server);
	registerLoginTool(server);
}
