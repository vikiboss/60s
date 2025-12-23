import { Elysia } from 'elysia'
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
import { config } from './config.ts'

const serviceGoldPrice = new GoldPriceService()

// Endpoint 列表
const ENDPOINTS = [
  '/v2/60s',
  '/v2/60s/rss',
  '/v2/answer',
  '/v2/baike',
  '/v2/bili',
  '/v2/bing',
  '/v2/changya',
  '/v2/chemical',
  '/v2/douyin',
  '/v2/duanzi',
  '/v2/epic',
  '/v2/exchange-rate',
  '/v2/fabing',
  '/v2/hitokoto',
  '/v2/ip',
  '/v2/kfc',
  '/v2/luck',
  '/v2/today-in-history',
  '/v2/toutiao',
  '/v2/weibo',
  '/v2/zhihu',
  '/v2/lunar',
  '/v2/ai-news',
  '/v2/awesome-js',
  '/v2/qrcode',
  '/v2/dad-joke',
  '/v2/rednote',
  '/v2/dongchedi',
  '/v2/moyu',
  '/v2/quark',
  '/v2/health',
  '/v2/password',
  '/v2/password/check',
  '/v2/maoyan/all/movie',
  '/v2/maoyan/realtime/movie',
  '/v2/maoyan/realtime/tv',
  '/v2/maoyan/realtime/web',
  '/v2/hacker-news/new',
  '/v2/hacker-news/top',
  '/v2/hacker-news/best',
  '/v2/baidu/hot',
  '/v2/baidu/teleplay',
  '/v2/baidu/tieba',
  '/v2/weather/realtime',
  '/v2/weather/forecast',
  '/v2/ncm-rank/list',
  '/v2/ncm-rank/:id',
  '/v2/color/random',
  '/v2/color/palette',
  '/v2/lyric',
  '/v2/fuel-price',
  '/v2/gold-price',
  '/v2/og',
  '/v2/hash',
  '/v2/fanyi',
  '/v2/fanyi/langs',
  '/v2/whois',
  '/v2/beta/kuan',
  '/v2/beta/qq/profile',
]

// 根路由
export const rootRouter = new Elysia({ name: 'root-router' })
  .get('/', () => ({ ...Common.getApiInfo(), endpoints: ENDPOINTS }))
  .get('/favicon.ico', ({ redirect }) => redirect('https://avatar.viki.moe', 302))
  .get('/health', () => 'ok')
  .get('/endpoints', () => ENDPOINTS)
  .get('*', () => ({ ...Common.getApiInfo(), endpoints: ENDPOINTS }))

// 应用路由 (v2 前缀)
export const appRouter = new Elysia({ name: 'app-router', prefix: '/v2' })
  .derive(({ query }) => ({ encoding: query[config.encodingParamName] || 'json' }))
  // === 以下为已发布的正式接口 ===
  .get('/60s', (ctx) => service60s.handle(ctx))
  .get('/60s/rss', (ctx) => service60sRss.handle(ctx))
  .get('/answer', (ctx) => serviceAnswer.handle(ctx))
  .get('/baike', (ctx) => serviceBaike.handle(ctx))
  .get('/bili', (ctx) => serviceBili.handle(ctx))
  .get('/bing', (ctx) => serviceBing.handle(ctx))
  .get('/changya', (ctx) => serviceChangYa.handle(ctx))
  .get('/chemical', (ctx) => serviceChemical.handle(ctx))
  .get('/douyin', (ctx) => serviceDouyin.handle(ctx))
  .get('/duanzi', (ctx) => serviceDuanzi.handle(ctx))
  .get('/epic', (ctx) => serviceEpic.handle(ctx))
  .get('/exchange-rate', (ctx) => serviceExRate.handle(ctx))
  .get('/fabing', (ctx) => serviceFabing.handle(ctx))
  .get('/hitokoto', (ctx) => serviceHitokoto.handle(ctx))
  .get('/ip', (ctx) => serviceIP.handle(ctx))
  .get('/kfc', (ctx) => serviceKfc.handle(ctx))
  .get('/luck', (ctx) => serviceLuck.handle(ctx))
  .get('/today-in-history', (ctx) => serviceTodayInHistory.handle(ctx))
  .get('/toutiao', (ctx) => serviceToutiao.handle(ctx))
  .get('/weibo', (ctx) => serviceWeibo.handle(ctx))
  .get('/zhihu', (ctx) => serviceZhihu.handle(ctx))
  .get('/lunar', (ctx) => serviceLunar.handle(ctx))
  .get('/ai-news', (ctx) => serviceAINews.handle(ctx))
  .get('/awesome-js', (ctx) => serviceAwesomeJs.handle(ctx))
  .get('/qrcode', (ctx) => serviceQRCode.handle(ctx))
  .get('/dad-joke', (ctx) => serviceDadJoke.handle(ctx))
  .get('/rednote', (ctx) => serviceRednote.handle(ctx))
  .get('/dongchedi', (ctx) => serviceDongchedi.handle(ctx))
  .get('/moyu', (ctx) => serviceMoyu.handle(ctx))
  .get('/quark', (ctx) => serviceQuark.handle(ctx))

  .get('/health', (ctx) => serviceHealth.handle(ctx))
  .get('/password', (ctx) => servicePassword.handle(ctx))
  .get('/password/check', (ctx) => servicePassword.handleCheck(ctx))

  .get('/maoyan/all/movie', (ctx) => serviceMaoyan.handleAllMovie(ctx))
  .get('/maoyan/realtime/movie', (ctx) => serviceMaoyan.handleRealtime('movie', ctx))
  .get('/maoyan/realtime/tv', (ctx) => serviceMaoyan.handleRealtime('tv', ctx))
  .get('/maoyan/realtime/web', (ctx) => serviceMaoyan.handleRealtime('web', ctx))

  .get('/hacker-news/new', (ctx) => serviceHackerNews.handle('top', ctx))
  .get('/hacker-news/top', (ctx) => serviceHackerNews.handle('top', ctx))
  .get('/hacker-news/best', (ctx) => serviceHackerNews.handle('best', ctx))

  .get('/baidu/hot', (ctx) => serviceBaidu.handleHotSearch(ctx))
  .get('/baidu/teleplay', (ctx) => serviceBaidu.handleTeleplay(ctx))
  .get('/baidu/tieba', (ctx) => serviceBaidu.handleTieba(ctx))

  .get('/weather/realtime', (ctx) => serviceWeather.handle(ctx))
  .get('/weather/forecast', (ctx) => serviceWeather.handleForecast(ctx))

  .get('/ncm-rank/list', (ctx) => serviceNcm.handleRank(ctx))
  .get('/ncm-rank/:id', (ctx) => serviceNcm.handleRankDetail(ctx))

  .get('/color/random', (ctx) => serviceColor.handle(ctx))
  .get('/color/palette', (ctx) => serviceColor.handlePalette(ctx))

  .all('/lyric', (ctx) => serviceLyric.handle(ctx))
  .all('/fuel-price', (ctx) => serviceFuelPrice.handle(ctx))
  .get('/gold-price', (ctx) => serviceGoldPrice.handle(ctx))

  // === 以下为支持 body 解析参数的接口 ===
  .all('/og', (ctx) => serviceOG.handle(ctx))
  .all('/hash', (ctx) => serviceHash.handle(ctx))

  .all('/fanyi', (ctx) => serviceFanyi.handle(ctx))
  .all('/fanyi/langs', () => serviceFanyi.handleLangs())
  .get('/whois', (ctx) => serviceWhois.handle(ctx))

  // === 以下为测试接口，beta 前缀，接口可能不稳定 ===
  .get('/beta/kuan', (ctx) => serviceKuan.handle(ctx))
  .get('/beta/qq/profile', (ctx) => serviceQQ.handle(ctx))

  // === 以下接口为兼容保留，未来大版本移除 ===
  .get('/exchange_rate', (ctx) => serviceExRate.handle(ctx))
  .get('/today_in_history', (ctx) => serviceTodayInHistory.handle(ctx))
  .get('/maoyan', (ctx) => serviceMaoyan.handleAllMovie(ctx))
  .get('/baidu/realtime', (ctx) => serviceBaidu.handleHotSearch(ctx))
  .get('/weather', (ctx) => serviceWeather.handle(ctx))
  .get('/ncm-rank', (ctx) => serviceNcm.handleRank(ctx))
  .get('/color', (ctx) => serviceColor.handle(ctx))
