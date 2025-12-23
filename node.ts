import { node } from '@elysiajs/node'
import { Elysia } from 'elysia'

import { middlewares } from './src/middlewares.ts'
import { appRouter, rootRouter } from './src/router.ts'
import { config } from './src/config.ts'

new Elysia({
  adapter: node(),
})
  .use(middlewares)
  .use(rootRouter)
  .use(appRouter)
  .listen(config.port)

console.log(`service is running at http://localhost:${config.port}`)
