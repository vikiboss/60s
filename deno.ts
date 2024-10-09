import { app } from './src/app.ts'

globalThis.env = Deno.env.toObject() || {}

console.log('service is running at http://localhost:8000')

await app.listen({ port: 8000 })
