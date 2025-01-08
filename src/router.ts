import { Router } from '@oak/oak/router'

import { service60s } from './module/60s.module'
import { serviceBaike } from './module/baike.module'
import { serviceBing } from './module/bing.module'
import { serviceDouyin } from './module/douyin.module'
import { serviceEpic } from './module/epic.module'
import { serviceExRate } from './module/ex-rate.module'

import { Common } from './common'
import { config } from './config'

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
appRouter.get('/bing', serviceBing.handle())
appRouter.get('/douyin', serviceDouyin.handle())
appRouter.get('/epic', serviceEpic.handle())
appRouter.get('/ex-rate/:currency', serviceExRate.handle())
