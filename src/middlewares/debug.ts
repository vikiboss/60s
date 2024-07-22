import type { Context, Next } from 'oak'

export default async function debug(ctx: Context, next: Next) {
  // for debug
  console.log(`[${new Date().toLocaleString('zh-CN')}] ${ctx.request.url.href}`)
  await next()
}
