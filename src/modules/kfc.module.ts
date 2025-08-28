import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceKfc {
  private lastFetchTime = 0
  private cacheDuration = 7 * 24 * 60 * 60 * 1000 // 缓存 7 天
  private cache: string[] = []

  handle(): RouterMiddleware<'/kfc'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)
      const list = await this.#fetch()

      let result: string

      if (id) {
        // 获取指定ID的段子
        const index = parseInt(id)
        if (index >= 0 && index < list.length) {
          result = list[index]
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${index} 的段子`)
          return
        }
      } else {
        // 随机获取段子（默认行为）
        result = Common.randomItem(list)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: list.findIndex((item: string) => item === result),
            kfc: result,
          })
          break
      }
    }
  }

  async #fetch() {
    if (this.cache && Date.now() - this.lastFetchTime <= this.cacheDuration) {
      return this.cache
    }

    const response = await fetch('https://cdn.jsdelivr.net/gh/vikiboss/v50@main/static/v50.json')
    const data = await response.json()

    if (data?.length > 0) {
      this.cache = data as string[]
      this.lastFetchTime = Date.now()
    }

    return data || []
  }
}

export const serviceKfc = new ServiceKfc()
