import * as oak from "@oak/oak";

const router = new oak.Router();
router.get("/", (ctx) => {
	ctx.response.body = {
		message: "Hello World",
	};
});

const app = new oak.Application();

// CORS middleware to allow all origins
app.use(async (ctx, next) => {
	ctx.response.headers.set("Access-Control-Allow-Origin", "*");
	ctx.response.headers.set(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS",
	);
	ctx.response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	if (ctx.request.method === "OPTIONS") {
		ctx.response.status = 204;
		return;
	}
	await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 8080 });
