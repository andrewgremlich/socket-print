import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import type { Context } from "@oak/oak/context";

// Update this to match your printer's IP and port
// const TARGET_BASE = "http://192.168.1.50";

const kv = await Deno.openKv();

const accessControlMiddleware = async (
	ctx: Context,
	next: () => Promise<unknown>,
) => {
	ctx.response.headers.set("Access-Control-Allow-Origin", "*");
	ctx.response.headers.set(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS",
	);
	ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
	if (ctx.request.method === "OPTIONS") {
		ctx.response.status = 204;
	} else {
		await next();
	}
};

const router = new Router();
router.get("/", (ctx) => {
	ctx.response.body = "hello world";
});

router.get("/health", (ctx) => {
	ctx.response.status = 200;
	ctx.response.body = { status: "ok" };
});

router.post("/set_printer_ip", async (ctx) => {
	const { ip } = await ctx.request.body.json();
	if (!ip) {
		ctx.response.status = 400;
		ctx.response.body = { error: "IP address is required" };
		return;
	}

	await kv.set(["printer_ip"], ip);
	ctx.response.status = 200;
	ctx.response.body = { status: "ok" };
});

const app = new Application();
app.use(accessControlMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 8724 }); // first recorded date working on this project 08-07-2024

// Deno.serve({ port: 8724 }, async (req) => {
// 	const url = new URL(req.url);
// 	const targetPath = url.pathname + url.search;

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
// });
