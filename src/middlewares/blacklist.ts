import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

const list: string[] = process.env.BLACKLIST_IPS ? JSON.parse(process.env.BLACKLIST_IPS) : []

export function blacklist(): Middleware {
  return async (ctx, next) => {
    const ip = ctx.request.ip

    if (ip && list.includes(ip)) {
      ctx.response.status = 403
      ctx.response.body = Common.buildJson(
        null,
        403,
        `由于滥用等原因，该 IP (${ip}) 已被禁止，如有疑问请联系 Viki <hi@viki.moe>`,
      )

      console.log(`[BLACKLIST] Blocked request from IP: ${ip}`)

      return
    }

    await next()
  }
}
