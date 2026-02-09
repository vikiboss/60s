import { Router } from '@oak/oak/router'
import { Common } from './common.ts'

import { service60s } from './modules/60s.module.ts'
import { service60sRss } from './modules/60s-rss.module.ts'
import { serviceAINews } from './modules/ai-news.module.ts'
import { serviceAnswer } from './modules/answer/answer.module.ts'
import { serviceAwesomeJs } from './modules/awesome-js/awesome-js.module.ts'
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
import { serviceLunar } from './modules/lunar/lunar.module.ts'
import { serviceMaoyan } from './modules/maoyan/maoyan.module.ts'
import { serviceNcm } from './modules/ncm.module.ts'
import { serviceOG } from './modules/og.module.ts'
import { serviceQQ } from './modules/qq.module.ts'
import { serviceQRCode } from './modules/qrcode/qrcode.module.ts'
import { serviceTodayInHistory } from './modules/today-in-history.module.ts'
import { serviceToutiao } from './modules/toutiao.module.ts'
import { serviceWeather } from './modules/weather.module.ts'
import { serviceWeibo } from './modules/weibo.module.ts'
import { serviceZhihu } from './modules/zhihu.module.ts'
import { serviceDadJoke } from './modules/dad-joke/dad-joke.module.ts'
import { serviceHackerNews } from './modules/hacker-news.module.ts'
import { serviceRednote } from './modules/rednote.module.ts'
import { serviceBaidu } from './modules/baidu.module.ts'
import { serviceDongchedi } from './modules/dongchedi.module.ts'
import { serviceHealth } from './modules/health.module.ts'
import { servicePassword } from './modules/password/password.module.ts'
import { serviceColor } from './modules/color.module.ts'
import { serviceKuan } from './modules/kuan.module.ts'
import { serviceLyric } from './modules/lyric.module.ts'
import { serviceMoyu } from './modules/moyu.module.ts'
import { serviceFuelPrice } from './modules/fuel-price/fuel-price.module.ts'
import { GoldPriceService } from './modules/gold-price.module.ts'
import { serviceQuark } from './modules/quark.module.ts'
import { serviceWhois } from './modules/whois.module.ts'
import { olympicsService } from './modules/olympics.module.ts'

// import { serviceSlackingCalendar } from './modules/slacking-calendar/slacking-calendar.module.ts'

const serviceGoldPrice = new GoldPriceService()

export const rootRouter = new Router()

rootRouter.get('/', (ctx) => {
  ctx.response.headers.set('Content-Type', 'application/json; charset=utf-8')
  const endpoints = Array.from(appRouter.entries(), ([_, v]) => v.path)
  ctx.response.body = JSON.stringify({ ...Common.getApiInfo(), endpoints }, null, 2)
})

rootRouter.get('/health', (ctx) => {
  ctx.response.body = 'ok'
})

rootRouter.get('/endpoints', (ctx) => {
  ctx.response.headers.set('Content-Type', 'application/json; charset=utf-8')
  ctx.response.body = Array.from(appRouter.entries(), ([_, v]) => v.path)
})

export const appRouter = new Router({
  prefix: '/v2',
})

// === 以下为已发布的正式接口 ===
appRouter.get('/60s', service60s.handle())
appRouter.get('/60s/rss', service60sRss.handle())
appRouter.get('/answer', serviceAnswer.handle())
appRouter.get('/baike', serviceBaike.handle())
appRouter.get('/bili', serviceBili.handle())
appRouter.get('/bing', serviceBing.handle())
appRouter.get('/changya', serviceChangYa.handle())
appRouter.get('/chemical', serviceChemical.handle())
appRouter.get('/douyin', serviceDouyin.handle())
appRouter.get('/duanzi', serviceDuanzi.handle())
appRouter.get('/epic', serviceEpic.handle())
appRouter.get('/exchange-rate', serviceExRate.handle())
appRouter.get('/fabing', serviceFabing.handle())
appRouter.get('/hitokoto', serviceHitokoto.handle())
appRouter.get('/ip', serviceIP.handle())
appRouter.get('/kfc', serviceKfc.handle())
appRouter.get('/luck', serviceLuck.handle())
appRouter.get('/today-in-history', serviceTodayInHistory.handle())
appRouter.get('/toutiao', serviceToutiao.handle())
appRouter.get('/weibo', serviceWeibo.handle())
appRouter.get('/zhihu', serviceZhihu.handle())
appRouter.get('/lunar', serviceLunar.handle())
appRouter.get('/ai-news', serviceAINews.handle())
appRouter.get('/awesome-js', serviceAwesomeJs.handle())
appRouter.get('/qrcode', serviceQRCode.handle())
appRouter.get('/dad-joke', serviceDadJoke.handle())
appRouter.get('/rednote', serviceRednote.handle())
appRouter.get('/dongchedi', serviceDongchedi.handle())
appRouter.get('/moyu', serviceMoyu.handle())
appRouter.get('/quark', serviceQuark.handle())

appRouter.get('/health', serviceHealth.handle())
appRouter.get('/password', servicePassword.handle())
appRouter.get('/password/check', servicePassword.handleCheck())

appRouter.get('/maoyan/all/movie', serviceMaoyan.handleAllMovie())
appRouter.get('/maoyan/realtime/movie', serviceMaoyan.handleRealtime('movie'))
appRouter.get('/maoyan/realtime/tv', serviceMaoyan.handleRealtime('tv'))
appRouter.get('/maoyan/realtime/web', serviceMaoyan.handleRealtime('web'))

appRouter.get('/hacker-news/new', serviceHackerNews.handle('top'))
appRouter.get('/hacker-news/top', serviceHackerNews.handle('top'))
appRouter.get('/hacker-news/best', serviceHackerNews.handle('best'))

appRouter.get('/baidu/hot', serviceBaidu.handleHotSearch())
appRouter.get('/baidu/teleplay', serviceBaidu.handleTeleplay())
appRouter.get('/baidu/tieba', serviceBaidu.handleTieba())

appRouter.get('/weather/realtime', serviceWeather.handle())
appRouter.get('/weather/forecast', serviceWeather.handleForecast())

appRouter.get('/ncm-rank/list', serviceNcm.handleRank())
appRouter.get('/ncm-rank/:id', serviceNcm.handleRankDetail())

appRouter.get('/color/random', serviceColor.handle())
appRouter.get('/color/palette', serviceColor.handlePalette())

appRouter.all('/lyric', serviceLyric.handle())
appRouter.all('/fuel-price', serviceFuelPrice.handle())
appRouter.get('/gold-price', serviceGoldPrice.handle())
appRouter.get('/olympics', olympicsService.handle())

// === 以下为支持 body 解析参数的接口 ===
appRouter.all('/og', serviceOG.handle())
appRouter.all('/hash', serviceHash.handle())

appRouter.all('/fanyi', serviceFanyi.handle())
appRouter.all('/fanyi/langs', serviceFanyi.handleLangs())
appRouter.get('/whois', serviceWhois.handle())

// === 以下为测试接口，beta 前缀，接口可能不稳定 ===
appRouter.get('/beta/kuan', serviceKuan.handle())
appRouter.get('/beta/qq/profile', serviceQQ.handle())

// === 以下为待定接口，还在计划、开发中 ===
// appRouter.get('/slacking-calendar', serviceSlackingCalendar.handle())

// === 以下接口为兼容保留，未来大版本移除 ===
appRouter.get('/exchange_rate', serviceExRate.handle())
appRouter.get('/today_in_history', serviceTodayInHistory.handle())
appRouter.get('/maoyan', serviceMaoyan.handleAllMovie())
appRouter.get('/baidu/realtime', serviceBaidu.handleHotSearch())
appRouter.get('/weather', serviceWeather.handle())
appRouter.get('/ncm-rank', serviceNcm.handleRank())
appRouter.get('/color', serviceColor.handle())
