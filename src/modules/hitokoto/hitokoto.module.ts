import { Common } from '../../common.ts'
import hitokotoData from './hitokoto.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceHitokoto {
  handle(): RouterMiddleware<'/hitokoto'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)
      
      let result: string
      
      if (id) {
        // 获取指定ID的句子
        const index = parseInt(id)
        if (index >= 0 && index < hitokotoData.length) {
          result = hitokotoData[index]
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${index} 的句子`)
          return
        }
      } else {
        // 随机获取句子（默认行为）
        result = Common.randomItem(hitokotoData)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result
          break

        case 'markdown':
          ctx.response.body = `# 一言\n\n> ${result}\n\n---\n\n*第 ${hitokotoData.findIndex((item) => item === result) + 1} 条*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: hitokotoData.findIndex((item) => item === result),
            hitokoto: result,
          })
          break
      }
    }
  }
}

export const serviceHitokoto = new ServiceHitokoto()
