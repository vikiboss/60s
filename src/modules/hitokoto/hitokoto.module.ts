import { Common } from '../../common.ts'
import hitokotoData from './hitokoto.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceHitokoto {
  handle(): RouterMiddleware<'/hitokoto'> {
    return (ctx) => {
      const hitokoto = Common.randomItem(hitokotoData)
      const index = hitokotoData.findIndex((item) => item === hitokoto)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = hitokoto
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index,
            hitokoto,
          })
          break
      }
    }
  }
}

export const serviceHitokoto = new ServiceHitokoto()
