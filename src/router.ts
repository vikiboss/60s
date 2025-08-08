import pkg from '../package.json' with { type: 'json' }

import { Router } from '@oak/oak/router'
import { config } from './config.ts'

import { service60s } from './modules/60s.module.ts'
import { serviceAnswer } from './modules/answer/answer.module.ts'
import { serviceBaike } from './modules/baike.module.ts'
import { serviceBili } from './modules/bili.module.ts'
import { serviceBing } from './modules/bing.module.ts'
import { serviceChangYa } from './modules/changya.module.ts'
import { serviceChemical } from './modules/chemical.module.ts'
import { serviceDouyin } from './modules/douyin.module.ts'
import { serviceDuanzi } from './modules/duanzi/duanzi.module.ts'
import { serviceEpic } from './modules/epic.module.ts'
import { serviceExRate } from './modules/exchange-rate.module.ts'
import { serviceFabing } from './modules/fabing/fabing.module.ts'
import { serviceFanyi } from './modules/fanyi/fanyi.module.ts'
import { serviceHash } from './modules/hash.module.ts'
import { serviceHitokoto } from './modules/hitokoto/hitokoto.module.ts'
import { serviceIP } from './modules/ip.module.ts'
import { serviceKfc } from './modules/kfc.module.ts'
import { serviceLuck } from './modules/luck/luck.module.ts'
import { serviceMaoyan } from './modules/maoyan.module.ts'
import { serviceOG } from './modules/og.module.ts'
import { serviceTodayInHistory } from './modules/today-in-history.module.ts'
import { serviceToutiao } from './modules/toutiao.module.ts'
import { serviceWeather } from './modules/weather.module.ts'
import { serviceWeibo } from './modules/weibo.module.ts'
import { serviceZhihu } from './modules/zhihu.module.ts'
import { serviceLunar } from './modules/lunar/lunar.module.ts'
import { serviceAINews } from './modules/ai-news.module.ts'

export const rootRouter = new Router()

rootRouter.get('/', (ctx) => {
  ctx.response.headers.set('Content-Type', 'application/json; charset=utf-8')
  ctx.response.body = JSON.stringify(
    {
      api_name: '60s-api',
      api_version: pkg.version,
      api_docs: 'https://docs.60s-api.viki.moe',
      author: config.author,
      user_group: config.group,
      github_repo: config.github,
      updated: pkg.updateTime,
      updated_at: new Date(pkg.updateTime).getTime(),
      endpoints: Array.from(appRouter.entries(), ([_, v]) => v.path),
    },
    null,
    2,
  )
})

rootRouter.get('/health', (ctx) => {
  ctx.response.body = 'ok'
})

export const appRouter = new Router({
  prefix: '/v2',
})

appRouter.get('/60s', service60s.handle())
appRouter.get('/answer', serviceAnswer.handle())
appRouter.get('/baike', serviceBaike.handle())
appRouter.get('/bili', serviceBili.handle())
appRouter.get('/bing', serviceBing.handle())
appRouter.get('/changya', serviceChangYa.handle())
appRouter.get('/chemical', serviceChemical.handle())
appRouter.get('/douyin', serviceDouyin.handle())
appRouter.get('/duanzi', serviceDuanzi.handle())
appRouter.get('/epic', serviceEpic.handle())
appRouter.get('/exchange_rate', serviceExRate.handle())
appRouter.get('/fabing', serviceFabing.handle())
appRouter.get('/hitokoto', serviceHitokoto.handle())
appRouter.get('/ip', serviceIP.handle())
appRouter.get('/kfc', serviceKfc.handle())
appRouter.get('/luck', serviceLuck.handle())
appRouter.get('/maoyan', serviceMaoyan.handle())
appRouter.get('/today_in_history', serviceTodayInHistory.handle())
appRouter.get('/toutiao', serviceToutiao.handle())
appRouter.get('/weibo', serviceWeibo.handle())
appRouter.get('/zhihu', serviceZhihu.handle())
appRouter.get('/lunar', serviceLunar.handle())
appRouter.get('/ai-news', serviceAINews.handle())

appRouter.all('/og', serviceOG.handle())
appRouter.all('/hash', serviceHash.handle())

appRouter.all('/fanyi', serviceFanyi.handle())
appRouter.all('/fanyi/langs', serviceFanyi.langs())

appRouter.get('/weather', serviceWeather.handle())
appRouter.get('/weather/forecast', serviceWeather.handleForecast())
