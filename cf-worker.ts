import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

import { middlewares } from './src/middlewares.ts'
import { appRouter, rootRouter } from './src/router.ts'

const app = new Elysia({ adapter: CloudflareAdapter })
  .use(middlewares)
  .use(rootRouter)
  .use(appRouter)
  .compile()

export default app
