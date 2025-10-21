import { Common } from '../../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceGitHubTrending {
  #cache: Map<string, TrendingRepo[]> = new Map()
  #lastUpdate: Map<string, number> = new Map()
  #cacheDuration = 60 * 60 * 1000 // 1小时缓存

  handle(): RouterMiddleware<'/industry/github-trending'> {
    return async (ctx) => {
      const lang = ctx.request.url.searchParams.get('lang') || ''
      const since = ctx.request.url.searchParams.get('since') || 'daily' // daily, weekly, monthly

      const data = await this.#fetch(lang, since)

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `GitHub Trending ${lang ? `(${lang})` : ''}\n\n${data
            .slice(0, 20)
            .map(
              (e, i) =>
                `${i + 1}. ${e.repo}\n   ⭐ ${e.stars} | Fork ${e.forks}\n   ${e.description || '暂无描述'}`,
            )
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

  async #fetch(lang: string, since: string): Promise<TrendingRepo[]> {
    const cacheKey = `${lang}-${since}`
    const now = Date.now()

    // 返回缓存数据
    const lastUpdate = this.#lastUpdate.get(cacheKey) || 0
    if (this.#cache.has(cacheKey) && now - lastUpdate < this.#cacheDuration) {
      return this.#cache.get(cacheKey)!
    }

    try {
      // 使用第三方API获取GitHub Trending
      const api = 'https://api.gitterapp.com/repositories'
      const params = new URLSearchParams({
        language: lang,
        since: since,
      })

      const response = await fetch(`${api}?${params}`, {
        headers: {
          'User-Agent': Common.chromeUA,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub Trending data')
      }

      const items = await response.json()

      const repos = items.map((item: any) => ({
        repo: item.fullName || item.name,
        author: item.author,
        name: item.name,
        description: item.description || '',
        link: item.url,
        language: item.language || '',
        stars: item.stars || 0,
        forks: item.forks || 0,
        currentPeriodStars: item.currentPeriodStars || 0,
        builtBy: item.builtBy || [],
      }))

      this.#cache.set(cacheKey, repos)
      this.#lastUpdate.set(cacheKey, now)

      return repos
    } catch (error) {
      // 如果请求失败但有缓存，返回旧缓存
      if (this.#cache.has(cacheKey)) {
        return this.#cache.get(cacheKey)!
      }
      throw error
    }
  }
}

export const serviceGitHubTrending = new ServiceGitHubTrending()

interface TrendingRepo {
  repo: string
  author: string
  name: string
  description: string
  link: string
  language: string
  stars: number
  forks: number
  currentPeriodStars: number
  builtBy: any[]
}
