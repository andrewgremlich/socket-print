const rrConnectResponse = {
	sessionTimeout: 8000,
	boardType: "duetwifi",
	fwVersion: "3.4.6",
	// Add any other fields expected by your client
};

Deno.serve({ port: 8080 }, (req) => {
	const url = new URL(req.url);

	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	if (req.method === "GET" && url.pathname === "/rr_connect") {
		return new Response(JSON.stringify(rrConnectResponse), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		});
	}

	return new Response("Not found", { status: 404, headers: corsHeaders });
});

console.log("Mock server running on http://localhost:8080");
