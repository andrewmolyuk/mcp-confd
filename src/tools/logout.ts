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
	setSessionCookie,
} from "../shared/sessionCookie.js";

export async function logout(baseUrl = getConfdJsonRpcUrlFromEnv()): Promise<{}> {
	const storedCookie = getSessionCookie();
	if (typeof storedCookie !== "string" || storedCookie.length === 0) {
		return {};
	}

	const payload = {
		jsonrpc: "2.0",
		id: 1,
		method: "logout",
	};

	const response = await withOptionalTlsBypass(baseUrl, async () =>
		fetch(baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: getRequestCookieHeaderValue(storedCookie),
			},
			body: JSON.stringify(payload),
		}),
	);

	const responseBody = (await response.json()) as { result?: {} } | JsonRpcErrorResponse;

	if ("error" in responseBody && responseBody.error) {
		if (responseBody.error.type === "session.invalid_sessionid") {
			setSessionCookie(null);
		}

		throw new Error(jsonRpcErrorMessage(responseBody.error));
	}

	setSessionCookie(null);
	return {};
}

function parseLogoutToolArgs(args: unknown): Record<string, never> {
	// Some MCP clients send metadata fields automatically. Ignore all inputs.
	void args;
	return {};
}

export function registerLogoutTool(server: McpServer): void {
	server.tool("logout", "Removes the active ConfD session and invalidates session cookie.", async (args: unknown) => {
		parseLogoutToolArgs(args);
		const result = await logout();
		return {
			content: [{ type: "text", text: JSON.stringify(result) }],
		};
	});
}
