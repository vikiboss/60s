import { Router } from './deps.ts'
import { fetch60s } from './services/60s.ts'
import { fetchBili } from './services/bili.ts'
import { fetchRatesByCurrency } from './services/ext-rates.ts'
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

// exchange rates
router.get('/ex-rates', async ctx => {
  const isText = ctx.state.isText
  const url = new URL(ctx.request.url)
  const currency = url.searchParams.get('c') || 'CNY'
  ctx.response.body = await fetchRatesByCurrency(currency, isText)
})

export default router
