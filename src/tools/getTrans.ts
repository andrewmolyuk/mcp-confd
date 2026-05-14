import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";

export interface Transaction {
	db: "running" | "startup" | "candidate";
	mode?: "read" | "read_write";
	conf_mode?: "private" | "shared" | "exclusive";
	tag?: string;
	th: number;
}

export interface GetTransResponse {
	trans: Transaction[];
}

export async function getTrans(baseUrl = getConfdJsonRpcUrlFromEnv()): Promise<GetTransResponse> {
	const result = await callConfdJsonRpc<GetTransResponse>(baseUrl, "get_trans");
	return result ?? { trans: [] };
}

export function registerGetTransTool(server: McpServer): void {
	server.tool(
		"get_trans",
		"Lists all open ConfD transactions for the current session.",
		{},
		async () => {
			const result = await getTrans();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
