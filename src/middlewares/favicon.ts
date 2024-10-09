import type { Context, Next } from '@oakserver/oak'

export default async function favicon(ctx: Context, next: Next) {
  if (ctx.request.url.pathname === '/favicon.ico') {
    ctx.response.redirect('https://avatar.viki.moe')
    return
  }

  await next()
}
