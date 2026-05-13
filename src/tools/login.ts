import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const DEFAULT_CONFD_HOST = "127.0.0.1";
const DEFAULT_CONFD_PORT = "8008";
const DEFAULT_CONFD_PROTOCOL = "http";

export interface LoginParams {
	user?: string;
	passwd?: string;
	ack_warning?: boolean;
}

interface JsonRpcErrorResponse {
	error: {
		code?: number;
		type?: string;
		message?: string;
		warning?: string;
	};
}

export interface LoginResponse {
	warning?: string;
	challenge_id?: string;
	challenge_prompt?: string;
	sessionid?: string;
}

let sessionCookie: string | null = null;

export function getSessionCookie(): string | null {
	return sessionCookie;
}

export function setSessionCookie(cookie: string | null): void {
	sessionCookie = cookie;
}

function parseSessionIdFromCookie(cookie: string): string | undefined {
	const sessionMatch = cookie.match(/(?:^|;\s*)sessionid=([^;]+)/i);
	return sessionMatch?.[1];
}

function getResponseCookies(response: Response): string[] {
	const typedHeaders = response.headers as Headers & {
		getSetCookie?: () => string[];
	};

	if (typeof typedHeaders.getSetCookie === "function") {
		return typedHeaders.getSetCookie();
	}

	const singleCookie = response.headers.get("set-cookie");
	return singleCookie ? [singleCookie] : [];
}

function jsonRpcErrorMessage(error: JsonRpcErrorResponse["error"]): string {
	const message = error.message ?? "Method failed";
	const warningSuffix = error.warning ? ` Warning: ${error.warning}` : "";
	const codePrefix = typeof error.code === "number" ? `[${error.code}] ` : "";
	const typePrefix = error.type ? `${error.type}: ` : "";
	return `${codePrefix}${typePrefix}${message}${warningSuffix}`;
}

function getConfdJsonRpcUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string {
	const rawProtocol = env.MCP_CONFD_PROTOCOL ?? DEFAULT_CONFD_PROTOCOL;
	const normalizedProtocol = rawProtocol.toLowerCase();

	if (normalizedProtocol !== "http" && normalizedProtocol !== "https") {
		throw new Error("MCP_CONFD_PROTOCOL must be http or https");
	}

	const host = env.MCP_CONFD_HOST ?? DEFAULT_CONFD_HOST;
	const port = env.MCP_CONFD_PORT ?? DEFAULT_CONFD_PORT;
	return `${normalizedProtocol}://${host}:${port}/jsonrpc`;
}

function shouldIgnoreTlsErrors(env: NodeJS.ProcessEnv = process.env): boolean {
	const value = env.MCP_CONFD_IGNORE_SSL_ERRORS;
	if (typeof value !== "string") {
		return false;
	}

	const normalizedValue = value.toLowerCase();
	return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes";
}

function getLoginCredentials(params: LoginParams, env: NodeJS.ProcessEnv = process.env): {
	user: string;
	passwd: string;
} {
	const user = params.user ?? env.MCP_CONFD_USER;
	const passwd = params.passwd ?? env.MCP_CONFD_PASSWORD;

	if (typeof user !== "string" || user.length === 0) {
		throw new Error("login requires user, provide params.user or MCP_CONFD_USER");
	}

	if (typeof passwd !== "string" || passwd.length === 0) {
		throw new Error("login requires passwd, provide params.passwd or MCP_CONFD_PASSWORD");
	}

	return { user, passwd };
}

export async function login(
	params: LoginParams,
	baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<LoginResponse> {
	const { user, passwd } = getLoginCredentials(params);
	const bypassTlsValidation = baseUrl.startsWith("https://") && shouldIgnoreTlsErrors();
	const previousTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

	const payload = {
		jsonrpc: "2.0",
		id: 1,
		method: "login",
		params: {
			user,
			passwd,
			ack_warning: params.ack_warning ?? false,
		},
	};

	if (bypassTlsValidation) {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	}

	let response: Response;
	try {
		response = await fetch(baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
	} finally {
		if (bypassTlsValidation) {
			if (typeof previousTlsRejectUnauthorized === "string") {
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsRejectUnauthorized;
			} else {
				delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
			}
		}
	}

	const responseBody = (await response.json()) as
		| { result?: LoginResponse }
		| JsonRpcErrorResponse;

	if ("error" in responseBody && responseBody.error) {
		throw new Error(jsonRpcErrorMessage(responseBody.error));
	}

	const cookies = getResponseCookies(response);
	const sessionCookieHeader = cookies.find((cookie) => /(?:^|;\s*)sessionid=/i.test(cookie));

	if (sessionCookieHeader) {
		sessionCookie = sessionCookieHeader;
	}

	const sessionid = sessionCookieHeader
		? parseSessionIdFromCookie(sessionCookieHeader)
		: undefined;
	const result = "result" in responseBody && responseBody.result ? responseBody.result : {};

	return {
		...result,
		sessionid,
	};
}

function parseLoginToolArgs(args: unknown): LoginParams {
	const params = args as Partial<LoginParams>;
	if ("user" in params && typeof params.user !== "string") {
		throw new Error("login field user must be a string when provided");
	}

	if ("passwd" in params && typeof params.passwd !== "string") {
		throw new Error("login field passwd must be a string when provided");
	}

	if ("ack_warning" in params && typeof params.ack_warning !== "boolean") {
		throw new Error("login field ack_warning must be a boolean when provided");
	}

	return {
		user: params.user,
		passwd: params.passwd,
		ack_warning: params.ack_warning,
	};
}

export function registerLoginTool(server: McpServer): void {
	server.tool(
		"login",
		"Creates a ConfD user session and returns warning/challenge details.",
		async (args: unknown) => {
			const result = await login(parseLoginToolArgs(args));
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);
}
