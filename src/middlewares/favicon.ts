import type { Middleware } from '@oak/oak'

export function favicon(): Middleware {
  return async (ctx, next) => {
    if (ctx.request.url.pathname === '/favicon.ico') {
      ctx.response.redirect('https://woaicc.cc/icon/favicon-192x192.png')

      return
    }

    await next()
  }
}
