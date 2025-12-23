import { Common } from '../../common.ts'
import hitokotoData from './hitokoto.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceHitokoto {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)
    
    let result: string
    
    if (id) {
      // 获取指定ID的句子
      const index = parseInt(id)
      if (index >= 0 && index < hitokotoData.length) {
        result = hitokotoData[index]
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到ID为 ${index} 的句子`)
      }
    } else {
      // 随机获取句子（默认行为）
      result = Common.randomItem(hitokotoData)
    }

    switch (ctx.encoding) {
      case 'text':
        return result

      case 'markdown':
        return `# 一言\n\n> ${result}\n\n---\n\n*第 ${hitokotoData.findIndex((item) => item === result) + 1} 条*`

      case 'json':
      default:
        return Common.buildJson({
          index: hitokotoData.findIndex((item) => item === result),
          hitokoto: result,
        })
    }
  }
}

export const serviceHitokoto = new ServiceHitokoto()
