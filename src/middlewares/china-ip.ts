import type { Middleware } from '@oak/oak'

export function chinaIp(): Middleware {
  return async (ctx, next) => {
    ctx.response.headers.set('X-Real-IP', '157.255.219.143') // ping qq.com

    await next()
  }
}
