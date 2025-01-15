import type { Middleware } from '@oak/oak'

export function favicon(): Middleware {
  return async (ctx, next) => {
    if (ctx.request.url.pathname === '/favicon.ico') {
      ctx.response.redirect('https://avatar.viki.moe')

      return
    }

    await next()
  }
}
