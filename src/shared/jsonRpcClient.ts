import {
	ConfdRpcError,
	fetchWithOptionalTlsBypass,
	jsonRpcErrorMessage,
	type JsonRpcErrorResponse,
} from "./confdRpc.js";
import { getRequestCookieHeaderValue, getSessionCookie } from "./sessionCookie.js";

function toTextSnippet(text: string): string {
	return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

function parseJsonIfPossible(rawBody: string): unknown | undefined {
	if (rawBody.length === 0) {
		return undefined;
	}

	try {
		return JSON.parse(rawBody) as unknown;
	} catch {
		return undefined;
	}
}

function getJsonRpcErrorIfPresent(payload: unknown): JsonRpcErrorResponse["error"] | undefined {
	if (typeof payload !== "object" || payload === null || !("error" in payload)) {
		return undefined;
	}

	const error = (payload as { error?: unknown }).error;
	if (typeof error !== "object" || error === null) {
		return undefined;
	}

	return error as JsonRpcErrorResponse["error"];
}

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

	const response = await fetchWithOptionalTlsBypass(baseUrl, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});

	const rawBody = await response.text();
	const parsedBody = parseJsonIfPossible(rawBody);
	const responseError = getJsonRpcErrorIfPresent(parsedBody);

	if (responseError) {
		throw new ConfdRpcError(jsonRpcErrorMessage(responseError), responseError.type);
	}

	if (!response.ok) {
		const snippet = toTextSnippet(rawBody);
		const statusText = response.statusText || "HTTP error";
		throw new ConfdRpcError(
			`HTTP ${response.status} ${statusText} for ${method}${snippet ? `: ${snippet}` : ""}`,
			"rpc.http_error",
		);
	}

	if (parsedBody === undefined || typeof parsedBody !== "object" || parsedBody === null) {
		throw new ConfdRpcError(
			`Invalid JSON response for ${method} (HTTP ${response.status})`,
			"rpc.invalid_response",
		);
	}

	if (!("result" in parsedBody)) {
		throw new ConfdRpcError(
			`Missing result in JSON-RPC response for ${method}`,
			"rpc.invalid_response",
		);
	}

	return (parsedBody as { result?: T }).result as T;
}
