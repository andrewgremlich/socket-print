/**
 * Mock Duet 3 MB6XD (RepRapFirmware standalone) HTTP interface.
 *
 * Implements the endpoints documented at
 * https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
 * against an in-memory virtual SD card, so the board-file install flow in
 * Provel Print can be exercised without hardware.
 *
 * Run: cd deno_scripts && deno task mock-printer
 *
 * Env flags:
 *   MOCK_PORT        listen port (default: 8080)
 *   MOCK_PASSWORD    required rr_connect password (default: empty)
 *   MOCK_MAX_SESSIONS  session cap before err:2 (default: 8)
 *   MOCK_REQUIRE_SESSION_KEY  "1" to reject requests missing X-Session-Key
 *                             once a keyed session exists (RRF >= 3.5-b4)
 *   MOCK_DEBUG       "1" to dump the whole virtual SD tree after every write
 *   MOCK_SEED        "1" to preseed 0:/sys and 0:/sys/provel at version 0.9.0
 *
 * Layout:
 *   mock-printer/config.ts    env flags and tunables
 *   mock-printer/vfs.ts       virtual SD card
 *   mock-printer/sessions.ts  session cap, timeout, X-Session-Key
 *   mock-printer/machine.ts   reboots, reply queue, object model, G-code
 *   mock-printer/http.ts      response builders, pagination
 *   mock-printer/routes/      one module per endpoint group
 */

import {
	MAX_SESSIONS,
	PASSWORD,
	PORT,
	REQUIRE_SESSION_KEY,
	SEED,
} from "./mock-printer/config.ts";
import { corsHeaders } from "./mock-printer/http.ts";
import { handle } from "./mock-printer/routes/index.ts";
import { seedFilesystem } from "./mock-printer/vfs.ts";

if (SEED) seedFilesystem();

Deno.serve({ port: PORT }, async (req) => {
	const url = new URL(req.url);

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	const startedAt = performance.now();
	const response = await handle(req, url);
	const elapsed = (performance.now() - startedAt).toFixed(1);

	console.log(
		`[HTTP] ${req.method} ${url.pathname}${url.search} -> ${response.status} (${elapsed}ms)`,
	);

	return response;
});

console.log(`Mock Duet printer running on http://localhost:${PORT}`);
console.log(
	`  password=${PASSWORD === "" ? "(empty)" : PASSWORD}  maxSessions=${MAX_SESSIONS}  requireSessionKey=${REQUIRE_SESSION_KEY}  seed=${SEED}`,
);
