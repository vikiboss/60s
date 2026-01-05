import { serviceIP } from '../modules/ip.module.ts'

import type { Middleware } from '@oak/oak'

export function debug(): Middleware {
  return async (ctx, next) => {
    const ua = ctx.request.headers?.get('user-agent') || '-'
    const ip = serviceIP.getClientIP(ctx.request.headers) || ctx.request.ip || '-'
    const date = new Date().toLocaleString('zh-CN')

    console.log(`[${date}] [${ip}] => UA: ${ua}`)
    console.log(`[${date}] [${ip}] => URL: ${ctx.request.url.href}`)

    await next()
  }
}
