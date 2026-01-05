import { serviceIP } from '../modules/ip.module.ts'

import type { Middleware } from '@oak/oak'

export function debug(): Middleware {
  return async (ctx, next) => {
    const ua = ctx.request.headers?.get('user-agent') || ''
    const referrer = ctx.request.headers?.get('referer') || ''
    const ip = serviceIP.getClientIP(ctx.request.headers) || ctx.request.ip || '-'
    const url = ctx.request.url.href || ''
    const method = ctx.request.method || ''
    const date = new Date().toLocaleString('zh-CN')

    console.log(`[${date}] [${ip}] ${method.toUpperCase()} ${url} (${ua || '未知 UA'})`)

    if (referrer) console.log(`[${date}] [${ip}] Referrer: ${referrer}`)

    await next()
  }
}
