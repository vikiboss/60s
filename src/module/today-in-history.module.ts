import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceTodayInHistory {
  #API = 'https://baike.deno.dev/today_in_history'

  handle(): RouterMiddleware<'/today_in_history'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.items
            .slice(0, 20)
            .map((e, idx) => `${idx + 1}. ${e.title} (${e.year} 年)`)
            .join('\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const { data = [] } = await (await fetch(this.#API)).json()
    const items = data as Item[]
    const [month, day] = data[0].date.split('-')
    return {
      date: `${month}月${day}日`,
      month,
      day,
      items,
    }
  }
}

export const serviceTodayInHistory = new ServiceTodayInHistory()

interface Item {
  title: string
  year: string
  desc: string
  date: string
  type: string
  link: string
}
