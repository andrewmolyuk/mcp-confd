import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	getConfdJsonRpcUrlFromEnv,
	jsonRpcErrorMessage,
	withOptionalTlsBypass,
	type JsonRpcErrorResponse,
} from "../shared/confdRpc.js";
import {
	setSessionCookie,
	parseSessionIdFromCookie,
} from "../shared/sessionCookie.js";
export { getSessionCookie, setSessionCookie } from "../shared/sessionCookie.js";

export interface LoginParams {
	user?: string;
	passwd?: string;
	ack_warning?: boolean;
}

export interface LoginResponse {
	warning?: string;
	challenge_id?: string;
	challenge_prompt?: string;
	sessionid?: string;
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

	const response = await withOptionalTlsBypass(baseUrl, async () =>
		fetch(baseUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		}),
	);

	const responseBody = (await response.json()) as
		| { result?: LoginResponse }
		| JsonRpcErrorResponse;

	if ("error" in responseBody && responseBody.error) {
		throw new Error(jsonRpcErrorMessage(responseBody.error));
	}

	const cookies = getResponseCookies(response);
	const sessionCookieHeader = cookies.find((cookie) => /(?:^|;\s*)sessionid=/i.test(cookie));

	if (sessionCookieHeader) {
		setSessionCookie(sessionCookieHeader);
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
