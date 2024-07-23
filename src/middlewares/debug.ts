import type { Context, Next } from "oak";

export default async function debug(ctx: Context, next: Next) {
	// for debug
	const ua = ctx.request.headers.get("user-agent") || "Unknown";
	const ip = ctx.request.ip || "Unknown";
	const date = new Date().toLocaleString("zh-CN");

	console.log(`[${date}] [${ip}] [${ua}] ${ctx.request.url.href}`);

	await next();
}
