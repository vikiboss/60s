import type { Context, Next } from "@oak/oak";

export default async function debug(ctx: Context, next: Next) {
	// for debug
	const ua = ctx.request.headers.get("user-agent") || "Unknown";
  const referer = ctx.request.headers.get("referer") || "Unknown";
	const ip = ctx.request.ip || "Unknown";
	const date = new Date().toLocaleString("zh-CN");

	console.log(`[${date}] [${referer}] [${ip}] [${ua}] ${ctx.request.url.href}`);

	await next();
}
