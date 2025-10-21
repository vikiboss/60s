import { Common } from '../../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceJuejin {
  #cache: TechNews[] = []
  #lastUpdate = 0
  #cacheDuration = 30 * 60 * 1000 // 30分钟缓存

  handle(): RouterMiddleware<'/industry/juejin'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `掘金热门文章\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}\n   ${e.description || ''}\n   👍 ${e.likes}`)
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
      // 掘金热门文章API
      const api = 'https://api.juejin.cn/content_api/v1/content/article_rank'
      const params = new URLSearchParams({
        category_id: '1', // 全部分类
        type: '2', // 热门
      })

      const response = await fetch(`${api}?${params}`, {
        headers: {
          'User-Agent': Common.chromeUA,
          'X-Agent': 'Juejin/Web',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Juejin data')
      }

      const result = await response.json()
      const items = result?.data || []

      this.#cache = items.map((item: any) => ({
        id: item.content?.content_id || item.article_id,
        title: item.content?.title || item.title,
        description: item.content?.brief_content || '',
        link: `https://juejin.cn/post/${item.content?.content_id || item.article_id}`,
        cover: item.content?.cover_image || '',
        author: item.author?.user_name || '',
        likes: item.content_counter?.digg || 0,
        views: item.content_counter?.view || 0,
        comments: item.content_counter?.comment || 0,
        published_at: item.content?.ctime || 0,
        published: item.content?.ctime ? Common.localeTime(item.content.ctime * 1000) : '',
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

export const serviceJuejin = new ServiceJuejin()

interface TechNews {
  id: string | number
  title: string
  description: string
  link: string
  cover: string
  author: string
  likes: number
  views: number
  comments: number
  published_at: number
  published: string
}
