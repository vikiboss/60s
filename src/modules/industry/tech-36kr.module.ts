import { Common } from '../../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceTech36Kr {
  #cache: TechNews[] = []
  #lastUpdate = 0
  #cacheDuration = 30 * 60 * 1000 // 30分钟缓存

  handle(): RouterMiddleware<'/industry/tech-36kr'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `36氪科技快讯\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}\n   ${e.description || ''}`)
            .join('\n\n')}`
          break
        }

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(): Promise<TechNews[]> {
    const now = Date.now()

    // 返回缓存数据
    if (this.#cache.length && now - this.#lastUpdate < this.#cacheDuration) {
      return this.#cache
    }

    try {
      // 36氪快讯API
      const api = 'https://www.36kr.com/api/info-flow/main_site/posts'
      const params = new URLSearchParams({
        b_id: '0',
        category: '0',
        per_page: '20',
        type: 'entInfo',
      })

      const response = await fetch(`${api}?${params}`, {
        headers: {
          'User-Agent': Common.chromeUA,
          Referer: 'https://www.36kr.com/',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch 36kr data')
      }

      const result = await response.json()
      const items = result?.data?.items || []

      this.#cache = items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.summary || item.description || '',
        link: `https://www.36kr.com/p/${item.id}`,
        cover: item.cover || '',
        published_at: item.published_at,
        published: Common.localeTime(item.published_at * 1000),
      }))

      this.#lastUpdate = now

      return this.#cache
    } catch (error) {
      // 如果请求失败但有缓存，返回旧缓存
      if (this.#cache.length) {
        return this.#cache
      }
      throw error
    }
  }
}

export const serviceTech36Kr = new ServiceTech36Kr()

interface TechNews {
  id: number
  title: string
  description: string
  link: string
  cover: string
  published_at: number
  published: string
}
