import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceTodayInHistory {
  handle(): RouterMiddleware<'/today_in_history'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `历史上的今天 (${data.date})\n\n${data.items
            .slice(0, 20)
            .map((e, idx) => `${idx + 1}. ${e.title} (${e.year} 年)`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const { data = [] } = await (await fetch('https://baike.deno.dev/today_in_history')).json()
    const items = data as Item[]
    const [month = 0, day = 0] = items[0].date?.split('-') || []
    return {
      date: month ? `${month}月${day}日` : '',
      month: +month,
      day: +day,
      items: items.map((e) => {
        return {
          title: e.title,
          year: e.year,
          description: e.desc,
          event_type: e.type,
          link: e.link,
        }
      }),
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
