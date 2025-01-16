///<reference lib="deno.ns" />

import { app } from './src/app.ts'
import { config } from './src/config.ts'

declare global {
  namespace globalThis {
    // deno-lint-ignore no-var
    var env: Record<string, string>
  }
}

globalThis.env = Deno.env.toObject()

Deno.serve(
  {
    port: config.port,
    hostname: 'localhost',
  },
  async (request, info) => {
    const res = await app.handle(request, info.remoteAddr)
    return res ?? Response.error()
  },
)
