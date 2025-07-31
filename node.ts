import { app } from './src/app.ts'
import { config } from './src/config.ts'

console.log(`service is running at http://localhost:${config.port}`)

await app.listen({
  hostname: config.host,
  port: config.port,
})
