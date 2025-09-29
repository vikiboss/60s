import { Common } from '../../common.ts'
import duanziData from './duanzi.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceDuanzi {
  handle(): RouterMiddleware<'/duanzi'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)
      const random = await Common.getParam('random', ctx.request)
      
      let result: string
      
      if (id) {
        // 获取指定ID的段子
        const index = parseInt(id)
        if (index >= 0 && index < duanziData.length) {
          result = duanziData[index]
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${index} 的段子`)
          return
        }
      } else {
        // 随机获取段子（默认行为）
        result = Common.randomItem(duanziData)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: duanziData.findIndex((item) => item === result),
            duanzi: result,
          })
          break
      }
    }
  }
}

export const serviceDuanzi = new ServiceDuanzi()
