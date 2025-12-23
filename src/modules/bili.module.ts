import { Common } from '../common.ts'

import type { AppContext } from '../types.ts'

class ServiceBili {
  async handle(ctx: AppContext) {
    const data = await this.#fetch()

    switch (ctx.encoding) {
      case 'text':
        return `B站实时热搜\n\n${data
          .map((e, i) => `${i + 1}. ${e.title}`)
          .slice(0, 20)
          .join('\n')}`

      case 'markdown':
        return `# B站实时热搜\n\n${data
          .slice(0, 20)
          .map((e, i) => `${i + 1}. [${e.title}](${e.link})`)
          .join('\n')}`

      case 'json':
      default:
        return Common.buildJson(data)
    }
  }

  async #fetch() {
    const options = { headers: { 'User-Agent': Common.chromeUA } }

    try {
      const api = 'https://api.bilibili.com/x/web-interface/wbi/search/square?limit=50'
      const { data = {} } = await (await fetch(api, options)).json()

      return ((data?.trending?.list || []) as Item[]).map((item) => {
        return {
          title: item.keyword || item.show_name,
          link: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
        }
      })
    } catch {
      const api = 'https://app.bilibili.com/x/v2/search/trending/ranking?limit=50'
      const { data = {} } = await (await fetch(api, options)).json()

      return ((data?.list?.filter((e: any) => +e?.is_commercial === 0) || []) as Item[]).map((item) => {
        return {
          title: item.keyword || item.show_name,
          link: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
        }
      })
    }
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
