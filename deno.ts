import { app } from './src/app.ts'
import { config } from './src/config.ts'

console.log(`service is running at http://localhost:${config.port}`)

// @ts-expect-error Deno serve
Deno.serve({ port: config.port, hostname: config.host }, app.fetch)
