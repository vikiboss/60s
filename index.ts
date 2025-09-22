import { app } from './src/app.ts'
import { config } from './src/config.ts'

const startApp = async () => {
  await app.listen({
    hostname: config.host,
    port: config.port,
  })
  console.log(`service is running at http://localhost:${config.port}`)
}
startApp()
