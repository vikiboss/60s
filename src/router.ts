import { Router } from '@oak/oak/router'
import { Common } from './common.ts'
import { config } from './config/index.ts'
import { service60s } from './module/60s.module.ts'
import { serviceBaike } from './module/baike.module.ts'
import { serviceBili } from './module/bili.module.ts'
import { serviceBing } from './module/bing.module.ts'
import { serviceDouyin } from './module/douyin.module.ts'
import { serviceEpic } from './module/epic.module.ts'
import { serviceExRate } from './module/ex-rate.module.ts'
import { serviceTodayInHistory } from './module/today-in-history.module.ts'
import { serviceToutiao } from './module/toutiao.module.ts'
import { serviceWeibo } from './module/weibo.module.ts'
import { serviceZhihu } from './module/zhihu.module.ts'

export const rootRouter = new Router()

rootRouter.get('/', ctx => {
  ctx.response.body = Common.buildJson({
    author: 'Viki <hi@viki.moe>',
    user_group: config.group,
    github_repo: config.github,
  })
})

export const appRouter = new Router({
  prefix: '/api/v2',
})

appRouter.get('/', ctx => {
  ctx.response.body = Common.buildJson({
    author: 'Viki <hi@viki.moe>',
    user_group: config.group,
    github_repo: config.github,
    api_version: '2.0',
  })
})

appRouter.get('/60s', service60s.handle())
appRouter.get('/baike', serviceBaike.handle())
appRouter.get('/bili', serviceBili.handle())
appRouter.get('/bing', serviceBing.handle())
appRouter.get('/douyin', serviceDouyin.handle())
appRouter.get('/epic', serviceEpic.handle())
appRouter.get('/ex-rate/:currency', serviceExRate.handle())
appRouter.get('/today_in_history', serviceTodayInHistory.handle())
appRouter.get('/toutiao', serviceToutiao.handle())
appRouter.get('/weibo', serviceWeibo.handle())
appRouter.get('/zhihu', serviceZhihu.handle())
