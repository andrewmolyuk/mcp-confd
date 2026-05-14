import {
	ConfdRpcError,
	jsonRpcErrorMessage,
	withOptionalTlsBypass,
	type JsonRpcErrorResponse,
} from "./confdRpc.js";
import { getRequestCookieHeaderValue, getSessionCookie } from "./sessionCookie.js";

export async function callConfdJsonRpc<T>(
	baseUrl: string,
	method: string,
	params?: Record<string, unknown>,
): Promise<T> {
	const storedCookie = getSessionCookie();

	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (typeof storedCookie === "string" && storedCookie.length > 0) {
		headers.Cookie = getRequestCookieHeaderValue(storedCookie);
	}

	const body: Record<string, unknown> = { jsonrpc: "2.0", id: 1, method };
	if (params !== undefined) {
		body.params = params;
	}

	const response = await withOptionalTlsBypass(baseUrl, async () =>
		fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body) }),
	);

	const responseBody = (await response.json()) as { result?: T } | JsonRpcErrorResponse;

	if ("error" in responseBody && responseBody.error) {
		throw new ConfdRpcError(
			jsonRpcErrorMessage(responseBody.error),
			responseBody.error.type,
		);
	}

	return ("result" in responseBody ? responseBody.result : undefined) as T;
}
