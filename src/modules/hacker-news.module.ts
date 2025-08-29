import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

const HN_BASE_URL: string = 'https://hacker-news.firebaseio.com/v0'
const DEFAULT_LIMIT_SIZE: number = 10
const DEFAULT_MAX_LIMIT_SIZE: number = 35

class ServiceHackerNews {
  private cache = new Map<string, CacheNewsItems>()
  // 10 minutes
  private readonly CACHE_TTL_MS = 10 * 60 * 1000

  handle(): RouterMiddleware<'/hacker-news/:type'> {
    return async (ctx) => {
      // 文章类型
      const type = ctx.params?.type as HackerNewsType
      const isValidType = Object.values(HackerNewsType).includes(type)
      if (!isValidType) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, `暂不支持 ${type} 文章类型查询`)
        return
      }
      // 查询数限制
      let limit = Number.parseInt(await Common.getParam('limit', ctx.request)) || DEFAULT_LIMIT_SIZE
      limit = Math.min(limit, DEFAULT_MAX_LIMIT_SIZE)

      // 是否需要强制刷新缓存
      const shouldRefresh = await Common.getParam('refresh', ctx.request) === 'true'

      const data = await this.#fetch(type, limit, shouldRefresh)

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `Hacker News（${HackerNewsTypeDescription[type]}）\n\n${data
            .map((e, idx) => 
              `${idx + 1}. ${e.title}\n${e.score} points by ${e.author}\n${e.link}\n${Common.localeTime(e.time * 1000)}`
            )
            .join('\n\n')}`
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


  async #fetch(type: string, limit: number, forceRefresh: boolean = false): Promise<NewsItemResponse[]> {
    // 生成唯一的缓存键
    const cacheKey = `hacker-news-${type}-${limit}`

    if (!forceRefresh) {
      // 检查是否存在有效缓存
      const cachedEntry = this.cache.get(cacheKey)
      if (cachedEntry) {
        const isExpired = (Date.now() - cachedEntry.timestamp) > this.CACHE_TTL_MS
        if (!isExpired) {
          return cachedEntry.items
        }
        // 如果缓存已过期，从 cache 中删除
        this.cache.delete(cacheKey)
      }
    } else {
      // 强制刷新缓存
      this.cache.delete(cacheKey);
    }

    try {
      const response = await fetch(`${HN_BASE_URL}/${type}stories.json`, {
        headers: {
          'User-Agent': Common.chromeUA
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const storyIds: number[] = (await response.json()).slice(0, limit)
      const storyPromises = storyIds.map(id => this.#fetchDetail(id))
      const storyDetails = await Promise.all(storyPromises)

      const formattedStories = storyDetails
        .filter(story => story !== null)
        .map(story => ({
          id: story.id,
          title: story.title,
          link: story.url,
          score: story.score,
          author: story.by,
          time: story.time
        } as NewsItemResponse))

      // 将新数据和当前时间戳存入缓存
      const newCachedEntry: CacheNewsItems = {
        items: formattedStories,
        timestamp: Date.now()
      }
      this.cache.set(cacheKey, newCachedEntry)

      return formattedStories
    } catch(error) {
      throw new Error(`Failed to fetch hacker-news-list: ${error}`)
    }
  }

  async #fetchDetail(id: number): Promise<NewsItem | null> {
    try {
      const response = await fetch(`${HN_BASE_URL}/item/${id}.json`, {
        headers: {
          'User-Agent': Common.chromeUA
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const details: NewsItem = await response.json()

      if (details && details.type === 'story') {
        return details
      }
      return null;
    } catch (error) {
      console.error(`Error fetching story details for id ${id}:`, error)
      return null;
    }
  }

}

export const serviceHackerNews = new ServiceHackerNews()

/**
 * Hacker News 文章类型枚举
 */
enum HackerNewsType {
  /**
   * 热门文章
   */
  Top = 'top',
  /**
   * 最新文章
   */
  New = 'new',
  /**
   * 最佳文章
   */
  Best = 'best',
}

/**
 * Hacker News 文章类型描述
 */
const HackerNewsTypeDescription: Record<HackerNewsType, string> = {
  [HackerNewsType.Top]: '热门文章',
  [HackerNewsType.New]: '最新文章',
  [HackerNewsType.Best]: '最佳文章',
};

/**
 * Hacker News 文章响应
 */
interface NewsItemResponse {
  /**
   * 文章 ID
   */
  id: number,
  /**
   * 文章的标题
   */
  title: string,
  /**
   * 文章的得分
   */
  score: number,
  /**
   * 文章的发布时间（Unix 时间戳）
   */
  time: number,
  /**
   * 文章的链接
   */
  link: string,
  /**
   * 文章的作者
   */
  author: string
}

/**
 * Hacker News 文章
 */
interface NewsItem {
  /**
   * 文章 ID
   */
  id: number,
  /**
   * 文章的标题
   */
  title: string,
  /**
   * 顶级评论的 ID 列表。如果没有评论则为 undefined。
   */
  kids: number[] | undefined,
  /**
   * 文章的得分
   */
  score: number,
  /**
   * 文章的发布时间（Unix 时间戳）
   */
  time: number,
  /**
   * 条目的类型 (例如 'story', 'job', 'comment')
   */
  type: string,
  /**
   * 文章的 URL
   */
  url: string,
  /**
   * 文章提交者的用户名
   */
  by: string,
  /**
   * 评论的总数
   */
  descendants: number
}

/**
 * Hacker News 文章缓存
 */
interface CacheNewsItems {
  /**
   * 缓存的文章列表
   */
  items: NewsItemResponse[],
  /**
   * 缓存创建时的时间戳，用于判断缓存是否过期。
   */
  timestamp: number
}