import { app } from './src/app.ts'
import { config } from './src/config.ts'

const server = Bun.serve({
  async fetch(req: Request): Promise<Response> {
    return (await app.handle(req)) || new Response('Not found', { status: 404 })
  },
  port: 123,
  hostname: config.host,
})

// console.log(`service is running at ${server.url}`)
console.log(`service is running at http://localhost:${config.port}`)
