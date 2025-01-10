import { app } from './src/app.ts'
import { config } from './src/config/index.ts'

globalThis.env = process.env

console.log(`service is running at http://localhost:${config.port}`)

await app.listen({
  port: config.port,
})
