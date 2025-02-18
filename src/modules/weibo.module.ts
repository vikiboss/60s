import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceWeibo {
  handle(): RouterMiddleware<'/weibo'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `微博实时热搜\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title} (${e.hot_value})`)
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
    const api = 'https://weibo.com/ajax/side/hotSearch'
    const { data = {} } = await (await fetch(api)).json()
    return (((data?.realtime || []) as Item[]).filter((e) => !e.is_ad) || []).map((e) => ({
      title: e.word,
      hot_value: e.num,
      link: `https://s.weibo.com/weibo?q=${encodeURIComponent(e.word)}`,
    }))
  }
}

export const serviceWeibo = new ServiceWeibo()

interface Item {
  word: string
  label_name?: string
  emoticon: string
  topic_flag: number
  icon_width?: number
  flag_desc?: string
  num: number
  flag?: number
  icon_desc?: string
  icon_desc_color?: string
  icon_height?: number
  small_icon_desc?: string
  realpos?: number
  icon?: string
  word_scheme?: string
  small_icon_desc_color?: string
  note: string
  rank: number
  icon_type?: string
  is_ad?: number
  topic_ad?: number
  dot_icon?: number
  id?: number
  monitors?: {
    app: object
    pc: object
  }
}
