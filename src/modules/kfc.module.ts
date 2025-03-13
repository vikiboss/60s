import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceKfc {
  handle(): RouterMiddleware<'/kfc'> {
    return async ctx => {
      const list = await this.fetchJson()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = list[Math.floor(Math.random() * list.length)]
          break

        case 'json':
        default: {
          const idx = Math.floor(Math.random() * list.length)
          ctx.response.body = Common.buildJson({
            index: idx,
            kfc: list[idx],
          })
          break
        }
      }
    }
  }

  async fetchJson() {
    return await (
      await fetch('https://cdn.jsdelivr.net/gh/vikiboss/v50@main/static/v50.json')
    ).json()
  }
}

export const serviceKfc = new ServiceKfc()
