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
      // 使用掘金的AI标签推荐文章
      const api = 'https://api.juejin.cn/recommend_api/v1/article/recommend_tag_feed'

      console.log('[AI News] 请求掘金AI标签文章')
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'User-Agent': Common.chromeUA,
          'X-Agent': 'Juejin/Web',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_type: 2,
          tag_id: '6809637767543259144', // AI标签ID
          sort_type: 200, // 热门
          cursor: '0',
          limit: 20,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const items = result?.data || []
      console.log(`[AI News] 返回状态: ${result.err_no}, 数据条数: ${items.length}`)

      if (!items.length) {
        throw new Error('AI资讯API返回空数据')
      }

      this.#cache = items.map((item: any) => ({
        id: item.article_id,
        title: item.article_info?.title || '',
        description: item.article_info?.brief_content || '',
        link: `https://juejin.cn/post/${item.article_id}`,
        cover: item.article_info?.cover_image || '',
        source: '掘金',
        author: item.author_user_info?.user_name || '',
        likes: item.article_info?.digg_count || 0,
        views: item.article_info?.view_count || 0,
        published_at: item.article_info?.ctime || 0,
        published: item.article_info?.ctime ? Common.localeTime(item.article_info.ctime * 1000) : '',
        tags: item.tags?.map((tag: any) => tag.tag_name) || [],
      }))

      this.#lastUpdate = now
      console.log(`[AI News] ✓ 成功缓存 ${this.#cache.length} 条数据`)

      return this.#cache
    } catch (error) {
      console.error('[AI News] 请求失败:', error)
      // 如果请求失败但有缓存，返回旧缓存
      if (this.#cache.length) {
        console.log('[AI News] 使用缓存数据')
        return this.#cache
      }
      throw new Error(`AI资讯API不可用: ${error}`)
    }
  }
}

export const serviceAINews = new ServiceAINews()

interface AINews {
  id: string | number
  title: string
  description: string
  link: string
  cover: string
  source: string
  author: string
  likes: number
  views: number
  published_at: number
  published: string
  tags: string[]
}
