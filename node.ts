import { app } from './src/app.ts'
import { config } from './src/config.ts'

globalThis.env = process.env as Record<string, string>

console.log(`service is running at http://localhost:${config.port}`)
// console.log(`service is running at http://${config.host}:${config.port}`)

await app.listen({
  hostname: config.host,
  port: config.port,
})
