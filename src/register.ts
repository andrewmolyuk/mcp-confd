import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetTransTool } from "./tools/getTrans.js";
import { registerLoginTool } from "./tools/login.js";
import { registerLogoutTool } from "./tools/logout.js";
import { registerPingTool } from "./tools/ping.js";

export function registerTools(server: McpServer): void {
	registerPingTool(server);
	registerLoginTool(server);
	registerLogoutTool(server);
	registerGetTransTool(server);
}
