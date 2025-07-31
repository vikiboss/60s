///<reference lib="deno.ns" />

import { app } from './src/app.ts'
import { config } from './src/config.ts'

declare global {
  namespace globalThis {
    // deno-lint-ignore no-var
    var env: Record<string, string>
  }
}

Deno.serve(
  {
    port: config.port,
    hostname: 'localhost',
  },
  async (request, info) => {
    return (await app.handle(request, info.remoteAddr)) || new Response('Not found', { status: 404 })
  },
)
