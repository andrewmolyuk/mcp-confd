export const DEFAULT_SESSION_KEY = "default";

export interface SessionStore {
	get(key: string): string | null;
	set(key: string, cookie: string | null): void;
	clear(): void;
}

class InMemorySessionStore implements SessionStore {
	private readonly cookies = new Map<string, string>();

	get(key: string): string | null {
		return this.cookies.get(key) ?? null;
	}

	set(key: string, cookie: string | null): void {
		if (typeof cookie === "string" && cookie.length > 0) {
			this.cookies.set(key, cookie);
			return;
		}

		this.cookies.delete(key);
	}

	clear(): void {
		this.cookies.clear();
	}
}

let sessionStore: SessionStore = new InMemorySessionStore();

export function setSessionStore(store: SessionStore): void {
	sessionStore = store;
}

export function resetSessionStore(): void {
	sessionStore = new InMemorySessionStore();
}

export function getSessionCookie(sessionKey = DEFAULT_SESSION_KEY): string | null {
	return sessionStore.get(sessionKey);
}

export function setSessionCookie(cookie: string | null, sessionKey = DEFAULT_SESSION_KEY): void {
	sessionStore.set(sessionKey, cookie);
}

export function parseSessionIdFromCookie(cookie: string): string | undefined {
	const sessionMatch = cookie.match(/(?:^|;\s*)sessionid(?:_\d+)?=([^;]+)/i);
	return sessionMatch?.[1];
}

export function getRequestCookieHeaderValue(cookie: string): string {
	const sessionMatch = cookie.match(/(?:^|;\s*)(sessionid(?:_\d+)?)=([^;]+)/i);
	if (!sessionMatch) {
		throw new Error("stored session cookie does not contain sessionid");
	}

	return `${sessionMatch[1]}=${sessionMatch[2]}`;
}
