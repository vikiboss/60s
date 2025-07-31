import { app } from './src/app.ts'
import { config } from './src/config.ts'

Bun.serve({
  async fetch(req: Request): Promise<Response> {
    return (await app.handle(req)) || new Response('Not found', { status: 404 })
  },
  port: config.port,
  hostname: config.host,
})

console.log(`service is running at http://localhost:${config.port}`)
