import { config } from '../config.ts'

import type { Middleware } from '@oak/oak'

export function encoding(): Middleware {
  return async (ctx, next) => {
    const encoding = ctx.request.url.searchParams.get(config.encodingParamName)

    if (encoding) {
      ctx.state.encoding = encoding
    }

    await next()
  }
}
