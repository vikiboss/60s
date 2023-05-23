import { Application } from './deps.ts'
import router from './router.ts'
import { responseWithBaseRes } from './utils.ts'

const app = new Application()

app.use(async (ctx, next) => {
  const { searchParams } = new URL(ctx.request.url)

  const isText = [
    searchParams.get('e')?.toLowerCase(),
    searchParams.get('encode')?.toLowerCase(),
    searchParams.get('encoding')?.toLowerCase()
  ].includes('text')

  ctx.state.isText = isText
  await next()
})

app.use(router.routes())
app.use(router.allowedMethods())

// not found
app.use(async ctx => {
  ctx.response.redirect('https://github.com/vikiboss/60s')
})

console.log('Server is at http://localhost:8000')

await app.listen({ port: 8000 })
