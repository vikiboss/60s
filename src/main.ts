import { Application } from 'oak'

import router from './router.ts'
import favicon from './middlewares/favicon.ts'
import notFound from './middlewares/not-found.ts'
import formatEncodingParam from './middlewares/encodings.ts'
import debug from './middlewares/debug.ts'

const app = new Application()

app.use(debug, favicon, formatEncodingParam)
app.use(router.routes(), router.allowedMethods())
app.use(notFound)

console.log('service is running at http://localhost:8000')

await app.listen({ port: 8000 })
