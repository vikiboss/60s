import { app } from './src/app.ts'
import { config } from './src/config.ts'

app.listen(config.port)

console.log(`service is running at http://localhost:${config.port}`)
