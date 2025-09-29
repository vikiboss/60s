import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

export function notFound(): Middleware {
  return async (ctx, next) => {
    await next()

    ctx.response.status = 404

    ctx.response.body = Common.buildJson(
      null,
      404,
      `404, 接口被吃掉了，请检查！应用接口需要在 Base URL 后面带上版本号，如 /v2/60s`,
    )

    return
  }
}
