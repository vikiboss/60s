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
    const api =
      'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot'
    const { data = {} } = await (await fetch(api)).json()
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
