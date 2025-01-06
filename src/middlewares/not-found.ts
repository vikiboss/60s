import type { Middleware } from '@oak/oak'

export function notFound(): Middleware {
  return async (ctx, next) => {
    await next()

    ctx.response.redirect('https://github.com/vikiboss/60s')

    return
  }
}
