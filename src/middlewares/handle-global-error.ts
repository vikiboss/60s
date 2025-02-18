import { Common } from '../common.ts'

import type { Middleware } from '@oak/oak'

export function handleGlobalError(): Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (err: any) {
      const isJSON = !ctx.state.encoding || ctx.state.encoding === 'json'
      const message = `服务器出错了... ${err?.message || err}`

      console.error(err)

      ctx.response.status = 500
      ctx.response.body = isJSON ? Common.buildJson(null, 500, message) : message
    }
  }
}
