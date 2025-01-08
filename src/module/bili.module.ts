import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBili {
  #API = 'https://app.bilibili.com/x/v2/search/trending/ranking'

  handle(): RouterMiddleware<'/bili'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.keyword}`)
            .join('\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const { data = {} } = await (await fetch(this.#API)).json()

    return ((data?.list?.filter((e: any) => e?.is_commercial === '0') || []) as Item[]).map(
      item => {
        const { is_commercial: _, position: __, show_name: ___, hot_id: id, ...rest } = item
        return {
          id,
          ...rest,
        }
      }
    )
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
