import type { Context, Next } from "@oakserver/oak";

export default async function cors(ctx: Context, next: Next) {
	ctx.response.headers.set("Access-Control-Allow-Origin", "*");
	ctx.response.headers.set("Access-Control-Allow-Headers", "*");
	ctx.response.headers.set(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS",
	);

	await next();
}
