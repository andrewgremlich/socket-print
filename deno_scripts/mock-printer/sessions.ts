/** Session bookkeeping: the cap, the timeout, and X-Session-Key enforcement. */

import { REQUIRE_SESSION_KEY, SESSION_TIMEOUT_MS } from "./config.ts";

type Session = { key: number | null; expiresAt: number };

const sessions = new Map<string, Session>();
let nextSessionKey = 1000;

export function sessionCount(): number {
	pruneSessions();
	return sessions.size;
}

export function pruneSessions(): void {
	const now = Date.now();
	for (const [id, session] of sessions) {
		if (session.expiresAt < now) sessions.delete(id);
	}
}

/** Opens a session, returning its key when the client asked for one. */
export function createSession(wantsKey: boolean): number | null {
	const key = wantsKey ? nextSessionKey++ : null;
	const id = key === null ? "anonymous" : `key:${key}`;
	sessions.set(id, { key, expiresAt: Date.now() + SESSION_TIMEOUT_MS });
	return key;
}

export function clearSessions(): void {
	sessions.clear();
}

export function sessionIdFor(req: Request, url: URL): string {
	// Real RRF keys sessions by client IP. Deno gives us the remote address via
	// the serve handler, but keying on the session key when present (and a
	// single shared id otherwise) is enough to model the behaviors the app
	// cares about: the session cap, and X-Session-Key enforcement.
	const headerKey = req.headers.get("X-Session-Key");
	if (headerKey) return `key:${headerKey}`;
	const queryKey = url.searchParams.get("sessionKey");
	if (queryKey && queryKey !== "yes" && queryKey !== "no") {
		return `key:${queryKey}`;
	}
	return "anonymous";
}

export function deleteSession(id: string): void {
	sessions.delete(id);
}

function touchSession(id: string): Session | undefined {
	pruneSessions();
	const session = sessions.get(id);
	if (session) session.expiresAt = Date.now() + SESSION_TIMEOUT_MS;
	return session;
}

export function hasValidSession(req: Request, url: URL): boolean {
	pruneSessions();
	if (sessions.size === 0) return false;

	const headerKey = req.headers.get("X-Session-Key");
	if (headerKey) return Boolean(touchSession(`key:${headerKey}`));

	if (REQUIRE_SESSION_KEY) {
		// A keyed session is live but this request did not present its key.
		for (const session of sessions.values()) {
			if (session.key !== null) return false;
		}
	}

	return Boolean(touchSession(sessionIdFor(req, url))) ||
		Boolean(touchSession("anonymous"));
}
