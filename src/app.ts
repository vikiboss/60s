import { Application } from '@oak/oak/application'

import { appRouter, rootRouter } from './router.ts'

import { cors } from './middlewares/cors.ts'
import { notFound } from './middlewares/not-found.ts'
import { favicon } from './middlewares/favicon.ts'
import { debug } from './middlewares/debug.ts'
import { blacklist } from './middlewares/blacklist.ts'
import { encoding } from './middlewares/encoding.ts'
import { handleGlobalError } from './middlewares/handle-global-error.ts'

export const app = new Application()

app.use(handleGlobalError())
app.use(blacklist(), debug(), cors(), favicon(), encoding())

app.use(rootRouter.routes(), rootRouter.allowedMethods())
app.use(appRouter.routes(), appRouter.allowedMethods())

app.use(notFound())
