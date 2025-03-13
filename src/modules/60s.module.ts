import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class Service60s {
  #cache = new Map<string, DailyNewsItem>()

  handle(): RouterMiddleware<'/60s'> {
    return async ctx => {
      const data = await this.#fetch(ctx.request.url.searchParams.get('date'))

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `每天 60s 看世界（${data.date}）\n\n${data.news
            .map((e, idx) => `${idx + 1}. ${e}`)
            .join('\n')}\n\n${data.tip ? `【微语】${data.tip}` : ''}`
          break
        }

        case 'image':
          ctx.response.redirect(data.image)
          break

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

  getVercelUrl(date: string): string {
    return `https://60s-static.viki.moe/60s/${date}.json`
  }

  getJsDelivrUrl(date: string): string {
    return `https://cdn.jsdelivr.net/gh/vikiboss/60s-static-host/static/60s/${date}.json`
  }

  async tryUrl(date: string) {
    const response = await fetch(this.getUrl(date))
      .catch(() => fetch(this.getVercelUrl(date)))
      .catch(() => fetch(this.getJsDelivrUrl(date)))

    if (response.ok) {
      const now = Date.now()
      const data = await response.json()

      if (!data?.news?.length) return null

      return {
        ...data,
        image: `https://60s-static.viki.moe/images/${data.date}.png`,
        link: data.link,
        created: data.created,
        created_at: data.created_at,
        updated: data.updated,
        updated_at: data.updated_at,
        api_updated: Common.localeTime(now),
        api_updated_at: now,
      } as DailyNewsItem
    } else {
      return null
    }
  }

  async #fetch(date?: string | null): Promise<DailyNewsItem> {
    const today = date || Common.localeDate(Date.now()).replace(/\//g, '-')
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
  image: string
  link: string
  updated: string
  updated_at: number
  api_updated: string
  api_updated_at: number
}
