import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBaike {
  #API = 'https://baike.deno.dev'
  // https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=%E8%A5%BF%E6%B8%B8%E8%AE%B0

  handle(): RouterMiddleware<'/baike'> {
    return async ctx => {
      const word = ctx.request.url.searchParams.get('word')

      if (!word) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '缺少 query 参数 word')
        return
      }

      try {
        const data = await this.#fetch(ctx.request.url.searchParams.get('word') ?? '')

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = `${data.name}: ${data.description} (更新于 ${data.update_time}, 详情: ${data.link})`
            break

          case 'json':
          default:
            ctx.response.body = Common.buildJson(data)
            break
        }
      } catch {
        ctx.response.status = 404
        ctx.response.body = Common.buildJson(null, 404, '未找到相关词条')
      }
    }
  }

  async #fetch(item: string) {
    const response = await fetch(`${this.#API}/item/${encodeURIComponent(item)}`)

    const res = (await response.json()) as {
      data: {
        itemName: string
        description: string
        cover: string
        link: string
        updateTime: string
      }
    }

    if (!res.data.itemName) {
      throw new Error('未找到相关词条')
    }

    return {
      name: res.data.itemName,
      description: res.data.description,
      cover: res.data.cover,
      update_time: res.data.updateTime,
      update_time_at: new Date(res.data.updateTime).getTime(),
      link: res.data.link,
    }
  }
}

export const serviceBaike = new ServiceBaike()
