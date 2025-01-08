import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBaike {
  #API = 'https://baike.deno.dev'

  handle(): RouterMiddleware<'/baike'> {
    return async ctx => {
      const word = ctx.request.url.searchParams.get('word')

      if (!word) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson({}, 400, '缺少 query 参数 word')
        return
      }

      const { data } = await this.#fetch(ctx.request.url.searchParams.get('word') ?? '')

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `${data.item}: ${data.description} (更新于 ${data.update_time}, 详情: ${data.link})`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(item: string) {
    const response = await fetch(`${this.#API}/item/${encodeURIComponent(item)}`)

    return (await response.json()) as {
      status: number
      message: string
      data: {
        item: string
        description: string
        cover: string
        link: string
        update_time: string
      }
    }
  }
}

export const serviceBaike = new ServiceBaike()
