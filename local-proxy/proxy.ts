import { Application } from "@oak/oak/application";
import { Router } from "@oak/oak/router";

import { accessControlMiddleware } from "./accessControlMiddleware.ts";

const kv = await Deno.openKv();

const router = new Router();

router.get("/health", (ctx) => {
	ctx.response.status = 200;
	ctx.response.body = { status: "ok" };
});

router.post("/printer_ip", async (ctx) => {
	try {
		const { ip } = await ctx.request.body.json();
		if (!ip) {
			ctx.response.status = 400;
			ctx.response.body = { error: "IP address is required" };
		}

		await kv.set(["printer_ip"], ip);
		ctx.response.status = 200;
		ctx.response.body = { success: true };
	} catch (error) {
		console.error("Error processing request:", error);

		ctx.response.status = 500;
		ctx.response.body = {
			message: "Could not set printer IP address",
			success: false,
		};
	}
});

router
	.get("/proxy/(.*)", async (ctx) => {
		const [printer_param] = ctx.params[0].split("/");
		const { search } = ctx.request.url;

		try {
			const { value: printerIp } = await kv.get(["printer_ip"]);
			const response = await fetch(
				`http://${printerIp}/${printer_param}${search}`,
				{
					method: ctx.request.method,
					headers: ctx.request.headers,
				},
			);

			ctx.response.status = response.status;
			ctx.response.body = await response.json();
		} catch (error) {
			console.error("Error processing request:", error);
			ctx.response.status = 500;
			ctx.response.body = {
				message: (error as TypeError).message,
				success: false,
			};
		}
	})
	.post("/proxy/(.*)", async (ctx) => {
		// NOTE: this is duplicated from GET but with POST-centric logic
		const [printer_param] = ctx.params[0].split("/");
		const { search } = ctx.request.url;

		try {
			const { value: printerIp } = await kv.get(["printer_ip"]);
			const body = await ctx.request.body.blob();
			const response = await fetch(
				`http://${printerIp}/${printer_param}${search}`,
				{
					method: ctx.request.method,
					headers: ctx.request.headers,
					body: body,
				},
			);

			ctx.response.status = response.status;
			ctx.response.body = await response.json();
		} catch (error) {
			console.error("Error processing request:", error);
			ctx.response.status = 500;
			ctx.response.body = {
				message: (error as TypeError).message,
				success: false,
			};
		}
	});

const app = new Application();
app.use(accessControlMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 8724 }); // first recorded date working on this project 08-07-2024
