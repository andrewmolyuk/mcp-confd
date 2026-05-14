import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";

export interface Transaction {
	db: "running" | "startup" | "candidate";
	mode: "read" | "read_write";
	conf_mode: "private" | "shared" | "exclusive";
	tag: string;
	th: number;
}

export interface GetTransResponse {
	trans: Transaction[];
}

export async function getTrans(baseUrl = getConfdJsonRpcUrlFromEnv()): Promise<GetTransResponse> {
	try {
		const result = await callConfdJsonRpc<GetTransResponse>(baseUrl, "get_trans");
		return result ?? { trans: [] };
	} catch (e) {
		if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
			return { trans: [] };
		}
		throw e;
	}
}

export function registerGetTransTool(server: McpServer): void {
	server.tool(
		"get_trans",
		"Lists all open ConfD transactions for the current session.",
		async () => {
			const result = await getTrans();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
