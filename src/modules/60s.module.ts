import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class Service60s {
  #cache = new Map<string, DailyNewsItem>()

  handle(): RouterMiddleware<'/60s'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `每天 60s 看世界（${data.date}）\n\n${data.news
            .map((e, idx) => `${idx + 1}. ${e}`)
            .join('\n')}\n\n${data.tip ? `【微语】${data.tip}` : ''}`
          break
        }

        case 'json':
        default: {
          ctx.response.body = Common.buildJson(data)
          break
        }
      }
    }
  }

  getUrl(date: string): string {
    return `https://raw.githubusercontent.com/vikiboss/60s-static-host/refs/heads/main/static/60s/${date}.json`
  }

  async tryUrl(date: string) {
    const response = await fetch(this.getUrl(date))

    if (response.ok) {
      const now = Date.now()
      return {
        ...(await response.json()),
        api_updated: Common.localeTime(now),
        api_updated_at: now,
      } as DailyNewsItem
    } else {
      return null
    }
  }

  async #fetch() {
    const today = Common.localeDate(Date.now()).replace(/\//g, '-')
    const yesterday = Common.localeDate(Date.now() - 24 * 60 * 60 * 1000).replace(/\//g, '-')
    const cachedItem = this.#cache.get(today)

    if (cachedItem) return cachedItem

    for (const date of [today, yesterday]) {
      const cache = this.#cache.get(date)

      if (cache) return cache

      const data = await this.tryUrl(date)

      if (data) {
        this.#cache.set(date, data)
        return data
      }
    }

    throw new Error('Failed to fetch 60s data, please try again later.')
  }
}

export const service60s = new Service60s()

interface DailyNewsItem {
  date: string
  news: {
    title: string
    link: string
  }[]
  audio: {
    news: string
    music: string
  }
  cover: string
  tip: string
  link: string
  updated: string
  updated_at: number
  api_updated: string
  api_updated_at: number
}
