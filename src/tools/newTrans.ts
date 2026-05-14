import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

const NewTransShape = {
	db: z.enum(["running", "startup", "candidate"]).optional(),
	mode: z.enum(["read", "read_write"]).optional(),
	conf_mode: z.enum(["private", "shared", "exclusive"]).optional(),
	tag: z.string().optional(),
	action_path: z.string().optional(),
	on_pending_changes: z.enum(["reuse", "reject", "discard"]).optional(),
};

export type NewTransParams = z.infer<z.ZodObject<typeof NewTransShape>>;

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
		return await callConfdJsonRpc<NewTransResponse>(baseUrl, "new_trans", rpcParams);
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
		NewTransShape,
		async (params) => {
			const result = await newTrans(params);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
