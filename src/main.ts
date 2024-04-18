import { Application } from './deps.ts'
import router from './router.ts'

const app = new Application()

const encodes = ['e', 'encode', 'encoding']

app.use(async (ctx, next) => {
  console.log(ctx.request.url) // for debug

  const { searchParams } = new URL(ctx.request.url)

  const isJson = encodes.some(e => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['json', 'JSON', 'Json'].includes(value)
  })

  const isImage = encodes.some(e => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['image', 'img'].includes(value)
  })

  const isText = encodes.some(e => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['text', 'txt', 'raw'].includes(value)
  })

  ctx.state.type = isImage ? 'image' : isJson ? 'json' : isText ? 'text' : 'json'
  await next()
})

app.use(router.routes())
app.use(router.allowedMethods())

// middleware for handling 404 errors
app.use(async ctx => {
  ctx.response.redirect('https://github.com/vikiboss/60s')
})

console.log('service is running at http://localhost:8000')

await app.listen({ port: 8000 })
