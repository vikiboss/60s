import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceWeibo {
  COOKIE =
    'SUB=_2AkMfiZ0rf8NxqwFRmvsQzWzrb4t2wg7EieKp1WzwJRMxHRl-yT9kqlIitRB6NAmzxF4VA1utRFGp8rQgmyrgezcW39y0; SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9W53ZGSdSzBm4kF5jod8B.He; _s_tentry=passport.weibo.com; Apache=6768551213104.772.1758794271221; SINAGLOBAL=6768551213104.772.1758794271221; ULV=1758794271230:1:1:1:6768551213104.772.1758794271221:'

  handle(): RouterMiddleware<'/weibo'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `微博实时热搜\n\n${data
            .map((e, i) => `${i + 1}. ${e.title}`)
            .slice(0, 20)
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
    const api =
      'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot'
    const { data = {} } = await (
      await fetch(api, {
        headers: {
          'User-Agent': Common.chromeUA,
          Cookie: this.COOKIE,
        },
      })
    ).json()
    return (((data?.cards?.[0]?.card_group || []) as Item[]).filter((e) => !e.pic.includes('stick')) || []).map(
      (e) => ({
        title: e.desc,
        hot_value: 0,
        link: `https://s.weibo.com/weibo?q=${encodeURIComponent(e.desc)}`,
      }),
    )
  }
}

export const serviceWeibo = new ServiceWeibo()

interface Item {
  icon?: string
  icon_width?: number
  itemid: string
  actionlog: {
    act_code: number
    fid: string
    luicode: string
    lfid: string
    uicode: string
    act_type: number
    ext: string
  }
  desc: string
  card_type: number
  pic: string
  icon_height?: number
  scheme: string
  desc_extr?: number | string
  promotion?: {
    monitor_url: Array<{
      third_party_click: string
      third_party_show: string
      type: string
      monitor_name?: string
    }>
  }
}
