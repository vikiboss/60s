import { Router } from './deps.ts'
import { fetch60s } from './services/60s.ts'
import { fetchBili } from './services/bili.ts'
import { fetchBing } from './services/bing.ts'
import { fetchRatesByCurrency } from './services/ext-rates.ts'
import { fetchWeibo } from './services/weibo.ts'

const router = new Router()

// default is 60s
router.get('/', async ctx => {
  ctx.response.body = await fetch60s(ctx.state.type)
})

// 60s
router.get('/60s', async ctx => {
  ctx.response.body = await fetch60s(ctx.state.type)
})

// bilibili
router.get('/bili', async ctx => {
  ctx.response.body = await fetchBili(ctx.state.type)
})

// weibo
router.get('/weibo', async ctx => {
  ctx.response.body = await fetchWeibo(ctx.state.type)
})

// exchange rates
router.get('/ex-rates', async ctx => {
  const url = new URL(ctx.request.url)
  const currency = url.searchParams.get('c') || 'CNY'
  ctx.response.body = await fetchRatesByCurrency(currency, ctx.state.type)
})

// bing wallpaper
router.get('/bing', async ctx => {
  const isImage = ctx.state.type === 'image'

  if (isImage) {
    ctx.response.redirect(await fetchBing(ctx.state.type))
  } else {
    ctx.response.body = await fetchBing(ctx.state.type)
  }
})

export default router
