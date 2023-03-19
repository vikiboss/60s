import { Router } from './deps.ts'
import { fetch60s } from './services/60s.ts'
import { fetchBili } from './services/bili.ts'
import { fetchWeibo } from './services/weibo.ts'

const router = new Router()

// default is 60s
router.get('/', async ctx => {
  const isText = ctx.state.isText
  ctx.response.body = await fetch60s(isText)
})

// 60s
router.get('/60s', async ctx => {
  const isText = ctx.state.isText
  ctx.response.body = await fetch60s(isText)
})

// bilibili
router.get('/bili', async ctx => {
  const isText = ctx.state.isText
  ctx.response.body = await fetchBili(isText)
})

// weibo
router.get('/weibo', async ctx => {
  const isText = ctx.state.isText
  ctx.response.body = await fetchWeibo(isText)
})

export default router
