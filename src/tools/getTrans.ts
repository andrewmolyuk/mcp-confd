import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	getConfdJsonRpcUrlFromEnv,
	jsonRpcErrorMessage,
	withOptionalTlsBypass,
	type JsonRpcErrorResponse,
} from "../shared/confdRpc.js";
import {
	getRequestCookieHeaderValue,
	getSessionCookie,
} from "../shared/sessionCookie.js";

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
	const storedCookie = getSessionCookie();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (typeof storedCookie === "string" && storedCookie.length > 0) {
		headers.Cookie = getRequestCookieHeaderValue(storedCookie);
	}

	const response = await withOptionalTlsBypass(baseUrl, async () =>
		fetch(baseUrl, {
			method: "POST",
			headers,
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "get_trans",
			}),
		}),
	);

	const responseBody = (await response.json()) as
		| { result?: GetTransResponse }
		| JsonRpcErrorResponse;

	if ("error" in responseBody && responseBody.error) {
		throw new Error(jsonRpcErrorMessage(responseBody.error));
	}

	const result =
		"result" in responseBody && responseBody.result
			? responseBody.result
			: { trans: [] };

	return result;
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
