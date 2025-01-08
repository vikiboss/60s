import { Common } from '../common'
import { config } from '../config'

import type { Middleware } from '@oak/oak'

export function notFound(): Middleware {
  return async (ctx, next) => {
    await next()

    ctx.response.body = Common.buildJson(null, 404, `接口被吃掉了！${config.commonMessage}`)

    return
  }
}
