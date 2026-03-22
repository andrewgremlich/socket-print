const rrConnectResponse = {
	sessionTimeout: 8000,
	boardType: "duetwifi",
	fwVersion: "3.4.6",
};

let isRebooting = false;
const REBOOT_DURATION_MS = 5000;

Deno.serve({ port: 8080 }, async (req) => {
	const url = new URL(req.url);

	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	// Simulate connection drop during reboot
	if (isRebooting) {
		console.log(`[REBOOT] Rejecting ${req.method} ${url.pathname} — rebooting`);
		return new Response("Service Unavailable", {
			status: 503,
			headers: corsHeaders,
		});
	}

	// GET /rr_connect
	if (req.method === "GET" && url.pathname === "/rr_connect") {
		console.log("[CONNECT] Client connected");
		return new Response(JSON.stringify(rrConnectResponse), {
			status: 200,
			headers: { "Content-Type": "application/json", ...corsHeaders },
		});
	}

	// POST /rr_upload — firmware upload
	if (req.method === "POST" && url.pathname === "/rr_upload") {
		const name = url.searchParams.get("name");
		if (!name) {
			return new Response(JSON.stringify({ err: 1 }), {
				status: 400,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		const body = await req.arrayBuffer();
		console.log(`[UPLOAD] Received ${body.byteLength} bytes → ${name}`);

		return new Response(JSON.stringify({ err: 0 }), {
			status: 200,
			headers: { "Content-Type": "application/json", ...corsHeaders },
		});
	}

	// GET /rr_gcode — execute G-code commands
	if (req.method === "GET" && url.pathname === "/rr_gcode") {
		const gcode = url.searchParams.get("gcode") ?? "";
		console.log(`[GCODE] ${gcode}`);

		// M997 triggers firmware flash + reboot
		if (gcode === "M997") {
			console.log(
				`[FLASH] Firmware flash triggered — rebooting for ${REBOOT_DURATION_MS}ms`,
			);
			isRebooting = true;
			setTimeout(() => {
				isRebooting = false;
				console.log("[FLASH] Reboot complete — back online");
			}, REBOOT_DURATION_MS);
		}

		return new Response(JSON.stringify({ buff: 0 }), {
			status: 200,
			headers: { "Content-Type": "application/json", ...corsHeaders },
		});
	}

	return new Response("Not found", { status: 404, headers: corsHeaders });
});

console.log("Mock server running on http://localhost:8080");
