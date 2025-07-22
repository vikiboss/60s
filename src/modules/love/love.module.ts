import { Common } from '../../common.ts'
import hitokotoData from './love.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceHitokoto {
  handle(): RouterMiddleware<'/love'> {
    return (ctx) => {
      const love = Common.randomItem(hitokotoData)
      const index = hitokotoData.findIndex((item) => item === love)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = love
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index,
            love,
          })
          break
      }
    }
  }
}

export const serviceHitokoto = new ServiceHitokoto()
