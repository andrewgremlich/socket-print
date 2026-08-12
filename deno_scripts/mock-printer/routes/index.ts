/** Route table plus the reboot and session guards every request passes. */

import { type RouteHandler, text } from "../http.ts";
import { isRebooting } from "../machine.ts";
import { hasValidSession } from "../sessions.ts";
import { fileRoutes } from "./file-routes.ts";
import { machineRoutes } from "./machine-routes.ts";
import { sessionRoutes } from "./session-routes.ts";

const routes: Record<string, RouteHandler> = {
	...sessionRoutes,
	...machineRoutes,
	...fileRoutes,
};

// Every endpoint except rr_connect requires a session (HTTP 401 otherwise).
const OPEN_ENDPOINTS = new Set(["/rr_connect"]);

export function handle(req: Request, url: URL): Response | Promise<Response> {
	const path = url.pathname;

	if (isRebooting()) {
		console.log(`[REBOOT] Rejecting ${req.method} ${path}`);
		return text("Service Unavailable", 503);
	}

	if (!OPEN_ENDPOINTS.has(path) && !hasValidSession(req, url)) {
		console.log(`[AUTH] 401 ${req.method} ${path} — no valid session`);
		return text("Unauthorized", 401);
	}

	const route = routes[path];
	if (!route) return text("Not found", 404);

	return route(req, url);
}
