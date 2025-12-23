import { Common } from '../../common.ts'
import duanziData from './duanzi.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceDuanzi {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)

    let result: string

    if (id) {
      // 获取指定ID的段子
      const index = parseInt(id)
      if (index >= 0 && index < duanziData.length) {
        result = duanziData[index]
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到ID为 ${index} 的段子`)
      }
    } else {
      // 随机获取段子（默认行为）
      result = Common.randomItem(duanziData)
    }

    switch (ctx.encoding) {
      case 'text':
        return result

      case 'markdown':
        return `# 😄 段子\n\n${result}\n\n---\n\n*第 ${duanziData.findIndex((item) => item === result) + 1} 条段子*`

      case 'json':
      default:
        return Common.buildJson({
          index: duanziData.findIndex((item) => item === result),
          duanzi: result,
        })
    }
  }
}

export const serviceDuanzi = new ServiceDuanzi()
