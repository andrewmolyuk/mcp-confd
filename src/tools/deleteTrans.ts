import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

export async function deleteTrans(
	th: number,
	baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<{}> {
	const storedCookie = getSessionCookie();
	if (typeof storedCookie !== "string" || storedCookie.length === 0) {
		throw new Error("delete_trans requires an active session, call login first");
	}

	try {
		await callConfdJsonRpc<{}>(baseUrl, "delete_trans", { th });
		return {};
	} catch (e) {
		if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
			throw new Error("delete_trans requires an active session, call login first");
		}
		throw e;
	}
}

export function registerDeleteTransTool(server: McpServer): void {
	server.tool(
		"delete_trans",
		"Deletes an open ConfD transaction by its transaction handle (th).",
		async (args: unknown) => {
			const params = args as { th: number };
			if (typeof params.th !== "number") {
				throw new Error("delete_trans requires a numeric th (transaction handle)");
			}
			const result = await deleteTrans(params.th);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
