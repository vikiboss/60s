import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

const blacklist: string[] = []

export function debug(): Middleware {
  return async (ctx, next) => {
    const ip = ctx.request.ip

    if (ip && blacklist.includes(ip)) {
      ctx.response.status = 403
      ctx.response.body = Common.buildJson(
        null,
        403,
        `由于滥用等原因，该 IP (${ip}) 已被禁止，如有疑问请联系 Viki <hi@viki.moe>`,
      )

      return
    }

    await next()
  }
}
