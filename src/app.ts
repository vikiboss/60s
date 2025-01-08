import { Application } from '@oak/oak/application'
import { appRouter, rootRouter } from './router'
import { cors } from './middlewares/cors'
import { notFound } from './middlewares/not-found'
import { favicon } from './middlewares/favicon'
import { debug } from './middlewares/debug'
import { encoding } from './middlewares/encoding'

export const app = new Application()

app.use(debug(), cors(), favicon(), encoding())

app.use(rootRouter.routes(), rootRouter.allowedMethods())
app.use(appRouter.routes(), appRouter.allowedMethods())

app.use(notFound())
