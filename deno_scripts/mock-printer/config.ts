/** Tunables and env flags for the mock Duet printer. See ../mock-printer.ts. */

export const PORT = Number(Deno.env.get("MOCK_PORT") ?? "8080");
export const BOARD_TYPE = "duet3mb6xd";
export const FIRMWARE_VERSION = "3.5.4";
export const SESSION_TIMEOUT_MS = 8000;
export const REBOOT_DURATION_MS = 5000;

export const PASSWORD = Deno.env.get("MOCK_PASSWORD") ?? "";
export const MAX_SESSIONS = Number(Deno.env.get("MOCK_MAX_SESSIONS") ?? "8");
export const REQUIRE_SESSION_KEY = Deno.env.get("MOCK_REQUIRE_SESSION_KEY") ===
	"1";
export const DEBUG = Deno.env.get("MOCK_DEBUG") === "1";
export const SEED = Deno.env.get("MOCK_SEED") === "1";
