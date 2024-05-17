import router from './router.ts'
import encodings from './middlewares/encodings.ts'
import { Application } from '@oak/oak'

const app = new Application()

app.use(encodings)
app.use(router.routes())
app.use(router.allowedMethods())

// middleware for handling 404 errors
app.use(async (ctx) => {
  ctx.response.redirect('https://github.com/vikiboss/60s')
})

console.log('service is running at http://localhost:8000')

await app.listen({ port: 8000 })
