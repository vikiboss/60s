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
      // 使用github-trending-api.com (基于huchenme/github-trending-api)
      // 备选：https://gh-trending-api.vercel.app (基于doforce/github-trending)
      const langParam = lang ? `/${lang}` : ''
      const sinceParam = since || 'daily'
      const api = `https://gh-trending-api.vercel.app/repositories${langParam}?since=${sinceParam}`

      const response = await fetch(api, {
        headers: {
          'User-Agent': Common.chromeUA,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub Trending data')
      }

      const items = await response.json()

      const repos = items.map((item: any) => ({
        repo: item.author && item.name ? `${item.author}/${item.name}` : item.repositoryName || '',
        author: item.author || '',
        name: item.name || item.repositoryName || '',
        description: item.description || '',
        link: item.url || `https://github.com/${item.author}/${item.name}`,
        language: item.language || '',
        stars: item.stars || 0,
        forks: item.forks || 0,
        currentPeriodStars: item.currentPeriodStars || item.starsSince || 0,
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
