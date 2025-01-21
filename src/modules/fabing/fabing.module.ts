import { Common } from '../../common.ts'
import fabingData from './fabing.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceFabing {
  handle(): RouterMiddleware<'/fabing'> {
    return (ctx) => {
      const name = ctx.request.url.searchParams.get('name') || '主人'
      const sayingRaw = Common.randomItem(fabingData)
      const index = fabingData.findIndex((item) => item === sayingRaw)
      const saying = sayingRaw.replaceAll('[name]', name)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = saying
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index,
            saying,
          })
          break
      }
    }
  }
}

export const serviceFabing = new ServiceFabing()
