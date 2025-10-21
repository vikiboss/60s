import { Common } from '../../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceAINews {
  #cache: AINews[] = []
  #lastUpdate = 0
  #cacheDuration = 30 * 60 * 1000 // 30分钟缓存

  handle(): RouterMiddleware<'/industry/ai-news'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `AI 行业资讯\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}\n   来源: ${e.source}`)
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

  async #fetch(): Promise<AINews[]> {
    const now = Date.now()

    // 返回缓存数据
    if (this.#cache.length && now - this.#lastUpdate < this.#cacheDuration) {
      return this.#cache
    }

    try {
      // 使用36氪的AI分类资讯
      const api = 'https://www.36kr.com/api/search-column/mainsite/info-flow'
      const params = new URLSearchParams({
        category_id: '27', // AI分类ID
        per_page: '20',
      })

      const response = await fetch(`${api}?${params}`, {
        headers: {
          'User-Agent': Common.chromeUA,
          Referer: 'https://www.36kr.com/',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI news data')
      }

      const result = await response.json()
      const items = result?.data?.items || []

      this.#cache = items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.summary || '',
        link: `https://www.36kr.com/p/${item.id}`,
        cover: item.cover || '',
        source: '36氪',
        published_at: item.published_at,
        published: Common.localeTime(item.published_at * 1000),
        tags: item.entity_tags?.map((tag: any) => tag.name) || [],
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

export const serviceAINews = new ServiceAINews()

interface AINews {
  id: number
  title: string
  description: string
  link: string
  cover: string
  source: string
  published_at: number
  published: string
  tags: string[]
}
