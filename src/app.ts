import { Elysia } from 'elysia'

import { middlewares } from './middlewares.ts'
import { appRouter, rootRouter } from './router.ts'

export const app = new Elysia()
  .use(middlewares)
  .use(rootRouter)
  .use(appRouter)
