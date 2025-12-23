import { Common } from '../../common.ts'
import answerData from './answer.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceAnswer {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)

    let result: any

    if (id) {
      // 获取指定ID的答案
      const index = parseInt(id)
      if (index >= 0 && index < answerData.length) {
        result = answerData[index]
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到ID为 ${index} 的答案`)
      }
    } else {
      // 随机获取答案（默认行为）
      result = Common.randomItem(answerData)
    }

    switch (ctx.encoding) {
      case 'text':
        return result.answer

      case 'markdown':
        return `# 答案之书\n\n## ${result.answer}\n\n---\n\n*第 ${answerData.findIndex((item) => item === result) + 1} 条答案*`

      case 'json':
      default:
        return Common.buildJson({
          ...result,
          index: answerData.findIndex((item) => item === result),
        })
    }
  }
}

export const serviceAnswer = new ServiceAnswer()
