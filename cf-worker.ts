import { app } from './src/app'

export default {
  fetch: (req: any, env: any, ctx: any) => {
    globalThis.env = env || {}
    return app.fetch(req, env, ctx)
  },
}
