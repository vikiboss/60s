import { Application } from './deps.ts'
import router from './router.ts'

const app = new Application()

app.use(async (ctx, next) => {
  const url = new URL(ctx.request.url)
  const isText = url.searchParams.get('encoding') === 'text'
  ctx.state.isText = isText
  await next()
})

app.use(router.routes())
app.use(router.allowedMethods())

console.log('Server is at http://localhost:8000')

await app.listen({ port: 8000 })
