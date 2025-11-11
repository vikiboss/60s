import { Common } from '../../common.ts'
import answerData from './answer.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceAnswer {
  handle(): RouterMiddleware<'/answer'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)

      let result: any

      if (id) {
        // 获取指定ID的答案
        const index = parseInt(id)
        if (index >= 0 && index < answerData.length) {
          result = answerData[index]
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${index} 的答案`)
          return
        }
      } else {
        // 随机获取答案（默认行为）
        result = Common.randomItem(answerData)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result.answer
          break

        case 'markdown':
          ctx.response.body = `# 答案之书\n\n## ${result.answer}\n\n---\n\n*第 ${answerData.findIndex((item) => item === result) + 1} 条答案*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            ...result,
            index: answerData.findIndex((item) => item === result),
          })
          break
      }
    }
  }
}

export const serviceAnswer = new ServiceAnswer()
