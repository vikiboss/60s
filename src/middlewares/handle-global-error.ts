import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

export function handleGlobalError(): Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (err: any) {
      console.error(err)
      ctx.response.status = 500
      ctx.response.body = Common.buildJson(null, 500, `啊... 服务器出错了！${err?.message || err}`)
    }
  }
}
