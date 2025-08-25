import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceKfc {
  handle(): RouterMiddleware<'/kfc'> {
    return async ctx => {
      const id = await Common.getParam('id', ctx.request)
      const list = await this.fetchJson()
      
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

  async fetchJson() {
    return await (
      await fetch('https://cdn.jsdelivr.net/gh/vikiboss/v50@main/static/v50.json')
    ).json()
  }
}

export const serviceKfc = new ServiceKfc()
