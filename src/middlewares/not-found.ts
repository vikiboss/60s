import { Common } from '../common.ts'
import { COMMON_MSG } from '../config.ts'

import type { Middleware } from '@oak/oak'

export function notFound(): Middleware {
  return async (ctx, next) => {
    await next()

    ctx.response.status = 404
    ctx.response.body = Common.buildJson(null, 404, `接口被吃掉了！${COMMON_MSG}`)

    return
  }
}
