import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBili {
  handle(): RouterMiddleware<'/bili'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `B站实时热搜\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const api = 'https://app.bilibili.com/x/v2/search/trending/ranking'
    // const proxyUrl = 'https://proxy.viki.moe/x/v2/search/trending/ranking?proxy-host=app.bilibili.com'

    const options = { headers: { 'User-Agent': Common.chromeUA } }

    const res = await fetch(api, options).then((e) => e.text())
    // .catch(() => fetch(proxyUrl, options).then((e) => e.json()))

    console.log('[DEBUG] Bili: \n\n', res, '\n\n')

    const { data } = JSON.parse(res)

    // deno-lint-ignore no-explicit-any
    return ((data?.list?.filter((e: any) => e?.is_commercial === '0') || []) as Item[]).map((item) => {
      return {
        title: item.keyword || item.show_name,
        link: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
      }
    })
  }
}

export const serviceBili = new ServiceBili()

interface Item {
  icon?: string
  hot_id: number
  keyword: string
  position: number
  show_name: string
  word_type: number
  is_commercial: string
}
