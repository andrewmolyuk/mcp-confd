import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie, setSessionCookie } from "../shared/sessionCookie.js";

export async function logout(baseUrl = getConfdJsonRpcUrlFromEnv()): Promise<Record<string, never>> {
	const storedCookie = getSessionCookie();
	if (typeof storedCookie !== "string" || storedCookie.length === 0) {
		return {};
	}

	try {
		await callConfdJsonRpc(baseUrl, "logout");
	} catch (e) {
		if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
			setSessionCookie(null);
		}
		throw e;
	}

	setSessionCookie(null);
	return {};
}

export function registerLogoutTool(server: McpServer): void {
	server.tool(
		"logout",
		"Removes the active ConfD session and invalidates session cookie.",
		{},
		async () => {
			const result = await logout();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
