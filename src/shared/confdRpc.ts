const DEFAULT_CONFD_HOST = "127.0.0.1";
const DEFAULT_CONFD_PORT = "8008";
const DEFAULT_CONFD_PROTOCOL = "http";

export interface JsonRpcErrorResponse {
	error: {
		code?: number;
		type?: string;
		message?: string;
		warning?: string;
	};
}

export function jsonRpcErrorMessage(error: JsonRpcErrorResponse["error"]): string {
	const message = error.message ?? "Method failed";
	const warningSuffix = error.warning ? ` Warning: ${error.warning}` : "";
	const codePrefix = typeof error.code === "number" ? `[${error.code}] ` : "";
	const typePrefix = error.type ? `${error.type}: ` : "";
	return `${codePrefix}${typePrefix}${message}${warningSuffix}`;
}

export function getConfdJsonRpcUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string {
	const rawProtocol = env.MCP_CONFD_PROTOCOL ?? DEFAULT_CONFD_PROTOCOL;
	const normalizedProtocol = rawProtocol.toLowerCase();

	if (normalizedProtocol !== "http" && normalizedProtocol !== "https") {
		throw new Error("MCP_CONFD_PROTOCOL must be http or https");
	}

	const host = env.MCP_CONFD_HOST ?? DEFAULT_CONFD_HOST;
	const port = env.MCP_CONFD_PORT ?? DEFAULT_CONFD_PORT;
	return `${normalizedProtocol}://${host}:${port}/jsonrpc`;
}

export function shouldIgnoreTlsErrors(env: NodeJS.ProcessEnv = process.env): boolean {
	const value = env.MCP_CONFD_IGNORE_SSL_ERRORS;
	if (typeof value !== "string") {
		return false;
	}

	const normalizedValue = value.toLowerCase();
	return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes";
}

export async function withOptionalTlsBypass<T>(
	baseUrl: string,
	action: () => Promise<T>,
): Promise<T> {
	const bypassTlsValidation = baseUrl.startsWith("https://") && shouldIgnoreTlsErrors();
	const previousTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

	if (bypassTlsValidation) {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	}

	try {
		return await action();
	} finally {
		if (bypassTlsValidation) {
			if (typeof previousTlsRejectUnauthorized === "string") {
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsRejectUnauthorized;
			} else {
				delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
			}
		}
	}
}
