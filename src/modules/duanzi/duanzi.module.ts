import { Common } from '../../common.ts'
import duanziData from './duanzi.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceDuanzi {
  handle(): RouterMiddleware<'/duanzi'> {
    return (ctx) => {
      const duanzi = Common.randomItem(duanziData)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = duanzi
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: duanziData.findIndex((item) => item === duanzi),
            duanzi,
          })
          break
      }
    }
  }
}

export const serviceDuanzi = new ServiceDuanzi()
