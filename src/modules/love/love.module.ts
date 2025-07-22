import { Common } from '../../common.ts'
import loveData from './love.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceLove {
  handle(): RouterMiddleware<'/love'> {
    return (ctx) => {
      const love = Common.randomItem(loveData)
      const index = loveData.findIndex((item) => item === love)

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

export const serviceLove = new ServiceLove()
