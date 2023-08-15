import { Router } from './deps.ts'
import { fetch60s } from './services/60s.ts'
import { fetchBili } from './services/bili.ts'
import { fetchBing } from './services/bing.ts'
import { fetchRatesByCurrency } from './services/ext-rates.ts'
import { fetchToutiao } from './services/toutiao.ts'
import { fetchWeibo } from './services/weibo.ts'
import { fetchXiaoai } from './services/xiaoai.ts'
import { fetchZhihu } from './services/zhihu.ts'

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

// zhihu
router.get('/zhihu', async ctx => {
  ctx.response.body = await fetchZhihu(ctx.state.type)
})

// toutiao
router.get('/toutiao', async ctx => {
  ctx.response.body = await fetchToutiao(ctx.state.type)
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

// 小爱
router.get('/xiaoai', async ctx => {
  const url = new URL(ctx.request.url)
  const text = url.searchParams.get('text') || '你好'
  const textOnly = url.searchParams.get('text-only') !== undefined
  ctx.response.body = await fetchXiaoai(text, textOnly, ctx.state.type)
})

export default router
