import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

export interface NewTransParams {
	db?: "running" | "startup" | "candidate";
	mode?: "read" | "read_write";
	conf_mode?: "private" | "shared" | "exclusive";
	tag?: string;
	action_path?: string;
	on_pending_changes?: "reuse" | "reject" | "discard";
}

export interface NewTransResponse {
	th: number;
}

export async function newTrans(
	params: NewTransParams = {},
	baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<NewTransResponse> {
	const storedCookie = getSessionCookie();
	if (typeof storedCookie !== "string" || storedCookie.length === 0) {
		throw new Error("new_trans requires an active session, call login first");
	}

	const rpcParams: Record<string, unknown> = {};

	if (params.db !== undefined) rpcParams.db = params.db;
	if (params.mode !== undefined) rpcParams.mode = params.mode;
	if (params.conf_mode !== undefined) rpcParams.conf_mode = params.conf_mode;
	if (params.tag !== undefined) rpcParams.tag = params.tag;
	if (params.action_path !== undefined) rpcParams.action_path = params.action_path;
	if (params.on_pending_changes !== undefined)
		rpcParams.on_pending_changes = params.on_pending_changes;

	try {
		const th = await callConfdJsonRpc<number>(baseUrl, "new_trans", rpcParams);
		return { th };
	} catch (e) {
		if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
			throw new Error("new_trans requires an active session, call login first");
		}
		throw e;
	}
}

export function registerNewTransTool(server: McpServer): void {
	server.tool(
		"new_trans",
		"Creates a new ConfD transaction and returns a transaction handle (th).",
		async (args: unknown) => {
			const params = (args ?? {}) as NewTransParams;
			const result = await newTrans(params);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
