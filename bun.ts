import { app } from './src/app'
import { config } from './src/config'

globalThis.env = process.env

console.log(`service is running at http://localhost:${config.port}`)

await app.listen({
  port: config.port,
})
