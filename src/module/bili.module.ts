import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'
import type { Service } from '../service'

class ServiceBili implements Service<'/bili'> {
  #API = 'https://app.bilibili.com/x/v2/search/trending/ranking'

  handle(): RouterMiddleware<'/bili'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.show_name}`)
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

    return (data?.list?.filter((e: any) => e?.is_commercial === '0') || []) as {
      position: number
      keyword: string
      show_name: string
      word_type: number
      icon?: string
      hot_id: number
      is_commercial: string
    }[]
  }
}

export const serviceBili = new ServiceBili()
