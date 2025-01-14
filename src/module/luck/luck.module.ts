import { Common } from '../../common.ts'
import luckData from './luck.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceLuck {
  handle(): RouterMiddleware<'/luck'> {
    return ctx => {
      const luck = Common.randomItem(luckData)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `${luck['good-luck']}: ${Common.randomItem(luck.content)}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            luck_desc: luck['good-luck'],
            luck_rank: luck.rank,
            luck_tip: Common.randomItem(luck.content),
          })
      }
    }
  }
}

export const serviceLuck = new ServiceLuck()
