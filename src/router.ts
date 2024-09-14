import { Router } from 'oak'

import { fetch60s } from './services/60s.ts'
import { fetchBaike } from './services/baike.ts'
import { fetchBili } from './services/bili.ts'
import { fetchBing } from './services/bing.ts'
import { fetchDouyin } from './services/douyin.ts'
import { fetchEpicFreeGames } from './services/epic.ts'
import { fetchRatesByCurrency } from './services/ext-rates.ts'
import { fetchTodayInHistory } from './services/today-in-history.ts'
import { fetchToutiao } from './services/toutiao.ts'
import { fetchWeather } from './services/weather.ts'
import { fetchWeibo } from './services/weibo.ts'
import { fetchXiaoai } from './legacy-services/xiaoai.ts'
import { fetchZhihu } from './services/zhihu.ts'
import { fetchZhihuHot } from './services/zhihu-hot.ts'
import { fetchOlympics } from './services/olympics.ts'

const router = new Router()

const routerMap = {
  '/': fetch60s,
  '/60s': fetch60s,
  '/olympic': fetchOlympics,
  '/bili': fetchBili,
  '/weibo': fetchWeibo,
  '/zhihu': fetchZhihu,
  '/zhihu-hot': fetchZhihuHot,
  '/toutiao': fetchToutiao,
  '/douyin': fetchDouyin,
  '/epic': fetchEpicFreeGames,
  '/today_in_history': fetchTodayInHistory,
}

for (const [path, handler] of Object.entries(routerMap)) {
  router.get(path, async (ctx) => {
    ctx.response.body = await handler(ctx.state.type, ctx)
  })
}

// weather
router.get('/weather/:city', async (ctx) => {
  ctx.response.body = await fetchWeather(ctx.params.city, ctx.state.type, ctx)
})

// baike
router.get('/baike/:item', async (ctx) => {
  ctx.response.body = await fetchBaike(ctx.params.item, ctx.state.type)
})

// exchange rates
router.get('/ex-rates', async (ctx) => {
  const url = new URL(ctx.request.url)
  const currency = url.searchParams.get('c') || 'CNY'
  ctx.response.body = await fetchRatesByCurrency(currency, ctx.state.type)
})

// bing wallpaper
router.get('/bing', async (ctx) => {
  if (ctx.state.type === 'image') {
    ctx.response.redirect(await fetchBing(ctx.state.type))
  } else {
    ctx.response.body = await fetchBing(ctx.state.type)
  }
})

// 小爱，已失效
router.get('/xiaoai', async (ctx) => {
  const text = ctx.request.url.searchParams.get('text') || '你好'
  const textOnly = ctx.request.url.searchParams.get('text-only') === '1'
  ctx.response.body = await fetchXiaoai(text, textOnly, ctx.state.type)
})

export default router
