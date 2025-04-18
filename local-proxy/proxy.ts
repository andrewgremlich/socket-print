// proxy.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Update this to match your printer's IP and port
// const TARGET_BASE = "http://192.168.1.50";

console.log("🦕 Local proxy server running on http://localhost:8080");

serve(
	async (req: Request) => {
		const url = new URL(req.url);
		const targetPath = url.pathname + url.search;

		return new Response("Hello from the proxy server!", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});

		// const proxiedUrl = `${TARGET_BASE}${targetPath}`;

		// const newReq = new Request(proxiedUrl, {
		// 	method: req.method,
		// 	headers: req.headers,
		// 	body: req.body,
		// 	redirect: "manual",
		// });

		// try {
		// 	const response = await fetch(newReq);
		// 	return new Response(response.body, {
		//     status: response.status,
		//     headers: new Headers({
		//       ...Object.fromEntries(response.headers.entries()),
		//       "Access-Control-Allow-Origin": "*",
		//       "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		//       "Access-Control-Allow-Headers": "Content-Type",
		//     }),
		//   });
		// } catch (err) {
		// 	console.error("Proxy error:", err);
		// 	return new Response("Proxy error", { status: 502 });
		// }
	},
	{ port: 8080 },
);
