import { Application } from '@oak/oak/application'

import cors from './middlewares/cors.ts'
import debug from './middlewares/debug.ts'
import router from './router.ts'
import favicon from './middlewares/favicon.ts'
import notFound from './middlewares/not-found.ts'
import formatEncodingParam from './middlewares/encodings.ts'

export const app = new Application()

declare global {
  // deno-lint-ignore no-var
  var env: Record<string, string | undefined>
}

app.use(debug, cors, favicon, formatEncodingParam)
app.use(router.routes(), router.allowedMethods())
app.use(notFound)
