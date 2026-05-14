import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDeleteTransTool } from "./tools/deleteTrans.js";
import { registerGetModulePrefixMapTool } from "./tools/getModulePrefixMap.js";
import { registerGetSchemaTool } from "./tools/getSchema.js";
import { registerGetTransTool } from "./tools/getTrans.js";
import { registerLoginTool } from "./tools/login.js";
import { registerLogoutTool } from "./tools/logout.js";
import { registerNewTransTool } from "./tools/newTrans.js";
import { registerPingTool } from "./tools/ping.js";

export function registerTools(server: McpServer): void {
	registerPingTool(server);
	registerLoginTool(server);
	registerLogoutTool(server);
	registerGetModulePrefixMapTool(server);
	registerGetTransTool(server);
	registerGetSchemaTool(server);
	registerNewTransTool(server);
	registerDeleteTransTool(server);
}
