import { Common } from '../../common.ts'
import answerData from './answer.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceAnswer {
  handle(): RouterMiddleware<'/answer'> {
    return (ctx) => {
      const answer = Common.randomItem(answerData)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = answer.answer
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(answer)
          break
      }
    }
  }
}

export const serviceAnswer = new ServiceAnswer()
