import process from 'node:process'
import { app } from '../legacy_src/app.ts'

globalThis.env = process.env || {}

console.log('service is running at http://localhost:8000')

await app.listen({ port: 8000 })
