import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceWeibo {
  COOKIE =
    'SUB=_2AkMflEwGf8NxqwFRmvsXxG7ia4h2wwrEieKpyL3dJRM3HRl-yT9yqk4mtRB6NBRi6maz6YaTyfIClrCyCUrm0-7nB1R9; SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9WhR9EPgz3BDPWy-YHwFuiIb; MLOGIN=0; _T_WM=29824971760; XSRF-TOKEN=3e7411; WEIBOCN_FROM=1110006030; mweibo_short_token=0f127e0728; M_WEIBOCN_PARAMS=fid%3D106003type%253D25%2526t%253D3%2526disable_hot%253D1%2526filter_type%253Drealtimehot%26uicode%3D10000011'

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

        case 'markdown':
          ctx.response.body = `# 微博实时热搜\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. [${e.title}](${e.link})`)
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
