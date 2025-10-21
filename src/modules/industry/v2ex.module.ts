import { Common } from '../../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceV2EX {
  #cache: V2EXTopic[] = []
  #lastUpdate = 0
  #cacheDuration = 10 * 60 * 1000 // 10分钟缓存

  handle(): RouterMiddleware<'/industry/v2ex'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `V2EX 技术热帖\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}\n   节点: ${e.node} | 回复: ${e.replies}`)
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

  async #fetch(): Promise<V2EXTopic[]> {
    const now = Date.now()

    // 返回缓存数据
    if (this.#cache.length && now - this.#lastUpdate < this.#cacheDuration) {
      return this.#cache
    }

    try {
      // V2EX API - 获取热门主题
      const api = 'https://www.v2ex.com/api/topics/hot.json'

      const response = await fetch(api, {
        headers: {
          'User-Agent': Common.chromeUA,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch V2EX data')
      }

      const items = await response.json()

      this.#cache = items.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || '',
        link: item.url,
        node: item.node?.title || '',
        node_name: item.node?.name || '',
        member: item.member?.username || '',
        replies: item.replies || 0,
        created: item.created,
        last_modified: item.last_modified,
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

export const serviceV2EX = new ServiceV2EX()

interface V2EXTopic {
  id: number
  title: string
  content: string
  link: string
  node: string
  node_name: string
  member: string
  replies: number
  created: number
  last_modified: number
}
