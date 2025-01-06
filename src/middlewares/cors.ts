import type { Middleware } from '@oak/oak'

export function cors(): Middleware {
  return async (ctx, next) => {
    ctx.response.headers.set('Access-Control-Allow-Origin', '*')
    ctx.response.headers.set('Access-Control-Allow-Headers', '*')
    ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

    await next()
  }
}
