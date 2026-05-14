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

export class ConfdRpcError extends Error {
	constructor(
		message: string,
		public readonly errorType?: string,
	) {
		super(message);
		this.name = "ConfdRpcError";
	}
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

let insecureTlsDispatcher: unknown;

type RuntimeWithBun = typeof globalThis & {
	Bun?: object;
};

function isBunRuntime(): boolean {
	return typeof (globalThis as RuntimeWithBun).Bun === "object";
}

async function getInsecureTlsDispatcher(): Promise<unknown> {
	if (insecureTlsDispatcher !== undefined) {
		return insecureTlsDispatcher;
	}

	const undiciModule = await import("undici");
	const AgentCtor = (undiciModule as { Agent?: new (options?: unknown) => unknown }).Agent;
	if (typeof AgentCtor !== "function") {
		throw new Error("MCP_CONFD_IGNORE_SSL_ERRORS requires undici Agent support");
	}

	insecureTlsDispatcher = new AgentCtor({ connect: { rejectUnauthorized: false } });
	return insecureTlsDispatcher;
}

export async function getOptionalTlsBypassFetchOptions(
	baseUrl: string,
): Promise<Record<string, unknown>> {
	const bypassTlsValidation = baseUrl.startsWith("https://") && shouldIgnoreTlsErrors();
	if (!bypassTlsValidation) {
		return {};
	}

	if (isBunRuntime()) {
		return {
			tls: { rejectUnauthorized: false },
		};
	}

	return {
		dispatcher: await getInsecureTlsDispatcher(),
	};
}

function shouldRetryWithLegacyTlsBypass(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return (
		message.includes("unable to verify") ||
		message.includes("certificate") ||
		message.includes("self signed") ||
		message.includes("dispatcher")
	);
}

async function withLegacyTlsBypass<T>(action: () => Promise<T>): Promise<T> {
	const previousTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	try {
		return await action();
	} finally {
		if (typeof previousTlsRejectUnauthorized === "string") {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsRejectUnauthorized;
		} else {
			delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
		}
	}
}

export async function fetchWithOptionalTlsBypass(
	baseUrl: string,
	init: RequestInit,
): Promise<Response> {
	const fetchOptions = await getOptionalTlsBypassFetchOptions(baseUrl);

	try {
		return await fetch(baseUrl, {
			...init,
			...fetchOptions,
		});
	} catch (error) {
		const bypassTlsValidation = baseUrl.startsWith("https://") && shouldIgnoreTlsErrors();
		if (!bypassTlsValidation || !shouldRetryWithLegacyTlsBypass(error)) {
			throw error;
		}

		return withLegacyTlsBypass(async () => fetch(baseUrl, init));
	}
}
