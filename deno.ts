///<reference lib="deno.ns" />

import { app } from './src/app.ts'
import { config } from './src/config/index.ts'

declare global {
  namespace globalThis {
    // deno-lint-ignore no-var
    var env: Record<string, string>
  }
}

globalThis.env = Deno.env.toObject()

console.log(`service is running at http://localhost:${config.port}`)

await app.listen({
  port: config.port,
})
