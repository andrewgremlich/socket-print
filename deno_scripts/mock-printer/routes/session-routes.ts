/** rr_connect / rr_disconnect. */

import {
	BOARD_TYPE,
	MAX_SESSIONS,
	PASSWORD,
	SESSION_TIMEOUT_MS,
} from "../config.ts";
import { json, type RouteHandler } from "../http.ts";
import {
	createSession,
	deleteSession,
	sessionCount,
	sessionIdFor,
} from "../sessions.ts";

export const sessionRoutes: Record<string, RouteHandler> = {
	"/rr_connect": (_req, url) => {
		const password = url.searchParams.get("password") ?? "";

		if (password !== PASSWORD) {
			console.log("[CONNECT] Wrong password");
			return json({ err: 1 });
		}

		if (sessionCount() >= MAX_SESSIONS) {
			console.log(`[CONNECT] Session cap ${MAX_SESSIONS} reached`);
			return json({ err: 2 });
		}

		const key = createSession(url.searchParams.get("sessionKey") === "yes");

		console.log(
			`[CONNECT] Session established${key === null ? "" : ` (key ${key})`}`,
		);

		return json({
			err: 0,
			sessionTimeout: SESSION_TIMEOUT_MS,
			boardType: BOARD_TYPE,
			...(key === null ? {} : { sessionKey: key }),
		});
	},

	"/rr_disconnect": (req, url) => {
		deleteSession(sessionIdFor(req, url));
		console.log("[DISCONNECT] Session closed");
		return json({ err: 0 });
	},
};
