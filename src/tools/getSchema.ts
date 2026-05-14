import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

const GetSchemaShape = {
	th: z.number().int().describe("Transaction handle"),
	namespace: z.string().optional(),
	path: z.string().optional(),
	levels: z.number().int().optional(),
	insert_values: z.boolean().optional(),
	evaluate_when_entries: z.boolean().optional(),
	stop_on_list: z.boolean().optional(),
};

export type GetSchemaParams = z.infer<z.ZodObject<typeof GetSchemaShape>>;

export interface GetSchemaResponse {
	meta: Record<string, unknown>;
	data: Record<string, unknown>;
}

export async function getSchema(
	params: GetSchemaParams,
	baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<GetSchemaResponse> {
	const storedCookie = getSessionCookie();
	if (typeof storedCookie !== "string" || storedCookie.length === 0) {
		throw new Error("get_schema requires an active session, call login first");
	}

	if (params.namespace === undefined && params.path === undefined) {
		throw new Error("get_schema requires either namespace or path");
	}

	const rpcParams: Record<string, unknown> = { th: params.th };
	if (params.namespace !== undefined) rpcParams.namespace = params.namespace;
	if (params.path !== undefined) rpcParams.path = params.path;
	if (params.levels !== undefined) rpcParams.levels = params.levels;
	if (params.insert_values !== undefined) rpcParams.insert_values = params.insert_values;
	if (params.evaluate_when_entries !== undefined)
		rpcParams.evaluate_when_entries = params.evaluate_when_entries;
	if (params.stop_on_list !== undefined) rpcParams.stop_on_list = params.stop_on_list;

	try {
		return await callConfdJsonRpc<GetSchemaResponse>(baseUrl, "get_schema", rpcParams);
	} catch (e) {
		if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
			throw new Error("get_schema requires an active session, call login first");
		}
		throw e;
	}
}

export function registerGetSchemaTool(server: McpServer): void {
	server.tool(
		"get_schema",
		"Exports JSON schema for a selected YANG module tree from an active transaction.",
		GetSchemaShape,
		async (params) => {
			const result = await getSchema(params);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
