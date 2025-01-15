import { serviceIP } from '../module/ip.module.ts'

import type { Middleware } from '@oak/oak'

export function debug(): Middleware {
  return async (ctx, next) => {
    const ua = ctx.request.headers?.get('user-agent') || 'Unknown'
    const ip = serviceIP.getClientIP(ctx.request.headers) || ctx.request.ip || 'Unknown'
    const date = new Date().toLocaleString('zh-CN')

    console.log(`[${date}] [${ip}] ${ctx.request.url.href}`)
    console.log(`[UA]: ${ua}`)

    await next()
  }
}
