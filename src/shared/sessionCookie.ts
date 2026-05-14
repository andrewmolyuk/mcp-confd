let sessionCookie: string | null = null;

export function getSessionCookie(): string | null {
	return sessionCookie;
}

export function setSessionCookie(cookie: string | null): void {
	sessionCookie = cookie;
}

export function parseSessionIdFromCookie(cookie: string): string | undefined {
	const sessionMatch = cookie.match(/(?:^|;\s*)sessionid=([^;]+)/i);
	return sessionMatch?.[1];
}

export function getRequestCookieHeaderValue(cookie: string): string {
	const sessionId = parseSessionIdFromCookie(cookie);
	if (!sessionId) {
		throw new Error("stored session cookie does not contain sessionid");
	}

	return `sessionid=${sessionId}`;
}
