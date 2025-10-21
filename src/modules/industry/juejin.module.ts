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
      // 掘金推荐文章API（使用搜索结果中找到的实际案例）
      // 参考: https://blog.csdn.net/frontend_frank/article/details/136360333
      const api = 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed'

      console.log('[Juejin] 请求掘金热门文章')
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'User-Agent': Common.chromeUA,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_type: 2,
          client_type: 2608,
          sort_type: 200, // 热门排序
          cursor: '0',
          limit: 20,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log(`[Juejin] 返回状态: ${result.err_no}, 数据条数: ${result?.data?.length || 0}`)

      const items = result?.data || []

      if (!items.length) {
        throw new Error('掘金API返回空数据')
      }

      this.#cache = items.map((item: any) => ({
        id: item.article_id || item.item_id,
        title: item.article_info?.title || '',
        description: item.article_info?.brief_content || '',
        link: `https://juejin.cn/post/${item.article_id || item.item_id}`,
        cover: item.article_info?.cover_image || '',
        author: item.author_user_info?.user_name || '',
        likes: item.article_info?.digg_count || 0,
        views: item.article_info?.view_count || 0,
        comments: item.article_info?.comment_count || 0,
        published_at: item.article_info?.ctime || 0,
        published: item.article_info?.ctime ? Common.localeTime(item.article_info.ctime * 1000) : '',
      }))

      this.#lastUpdate = now
      console.log(`[Juejin] ✓ 成功缓存 ${this.#cache.length} 条数据`)

      return this.#cache
    } catch (error) {
      console.error('[Juejin] 请求失败:', error)
      // 如果请求失败但有缓存，返回旧缓存
      if (this.#cache.length) {
        console.log('[Juejin] 使用缓存数据')
        return this.#cache
      }
      throw new Error(`掘金API不可用: ${error}`)
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
