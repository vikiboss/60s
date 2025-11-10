import { load } from 'cheerio'
import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceDongchedi {
  handle(): RouterMiddleware<'/dongchedi'> {
    return async (ctx) => {
      const list = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `懂车帝热搜\n\n${list
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title} (${e.score_desc})`)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 懂车帝热搜\n\n${list
            .slice(0, 20)
            .map((e, i) => `${i + 1}. [${e.title}](${e.url}) \`${e.score_desc}\``)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(list)
          break
      }
    }
  }

  #formateScore(score: number) {
    if (score >= 10000) return (score / 10000).toFixed(1) + 'w'
    return score.toString()
  }

  async #fetch() {
    // const api = 'https://www.dongchedi.com/motor/searchpage/launcher/main/v1/?aid=1839&app_name=auto_web_pc'
    // const response = await fetch(api)
    // const data = await response.json()

    const home = 'https://www.dongchedi.com/news'
    const html = await (await fetch(home, { headers: { 'user-agent': Common.chromeUA } })).text()

    const $ = load(html)
    const json = $('script#__NEXT_DATA__', html).contents().text()
    const data = JSON.parse(json)

    return ((data?.props?.pageProps?.hotSearchList || []) as HotItem[]).map((e, idx) => ({
      rank: idx + 1,
      title: e.title,
      url: `https://www.dongchedi.com/search?keyword=${encodeURIComponent(e.title)}`,
      // is_hot: e.is_hot,
      score: e.score,
      score_desc: this.#formateScore(e.score),
    }))
  }
}

export const serviceDongchedi = new ServiceDongchedi()

interface HotItem {
  gid: string
  title: string
  is_hot: number
  score: number
  description: string
  serial_icon: string
}
