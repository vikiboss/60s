import { config } from '../config.ts'
import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

const list: string[] = process.env.BLACKLIST_IPS ? JSON.parse(process.env.BLACKLIST_IPS) : []

export function blacklist(): Middleware {
  return async (ctx, next) => {
    const ip = ctx.request.ip
    const ua = ctx.request.headers.get('User-Agent') || '-'
    const url = ctx.request.url

    Common.debug(`[BLACKLIST] blacklist IP list: ${list.join(', ')}`)

    if (ip && list.includes(ip)) {
      ctx.response.status = 403
      ctx.response.body = Common.buildJson(
        null,
        403,
        `由于滥用等原因，该 IP (${ip}) 已被禁止，如有疑问请联系 ${config.author}`,
      )

      console.log(`[BLACKLIST] Blocked request from IP: ${ip}, URL: ${url}, UA: ${ua}`)

      return
    }

    await next()
  }
}
