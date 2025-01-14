import { app } from './src/app.ts'

export default {
  fetch: (req: any, env: any, ...rest) => {
    globalThis.env = env || {}
    return app.fetch(req, env, ...rest)
  },
}
