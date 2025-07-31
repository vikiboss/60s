import { app } from './src/app.ts'

export default {
  fetch: (req: any, env: any, ctx: any) => {
    return app.fetch(req, env, ctx)
  },
}
