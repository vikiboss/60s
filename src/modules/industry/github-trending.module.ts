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
      // API 1: ghtrending.vercel.app (搜索结果中找到的实际服务)
      // API 2: github-trending.vercel.app (备选)
      const apis = [
        {
          name: 'ghtrending.vercel.app',
          url: `https://ghtrending.vercel.app/repositories${lang ? `?lang=${lang}` : ''}${since ? `&since=${since}` : ''}`,
        },
        {
          name: 'github-trending.vercel.app',
          url: `https://github-trending.vercel.app/repo?lang=${lang || 'all'}&since=${since || 'daily'}`,
        },
      ]

      let items: any[] = []
      let lastError: Error | null = null

      for (const api of apis) {
        try {
          console.log(`[GitHub Trending] 尝试使用: ${api.name}`)
          const response = await fetch(api.url, {
            headers: {
              'User-Agent': Common.chromeUA,
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          items = await response.json()
          console.log(`[GitHub Trending] ✓ ${api.name} 成功，获取 ${items.length} 条数据`)
          break
        } catch (error) {
          console.error(`[GitHub Trending] ✗ ${api.name} 失败:`, error)
          lastError = error as Error
          continue
        }
      }

      if (!items.length && lastError) {
        throw lastError
      }

      const repos = items.map((item: any) => ({
        repo: item.author && item.name ? `${item.author}/${item.name}` : item.repositoryName || item.full_name || '',
        author: item.author || item.owner || '',
        name: item.name || item.repositoryName || '',
        description: item.description || '',
        link: item.url || item.html_url || `https://github.com/${item.author}/${item.name}`,
        language: item.language || '',
        stars: item.stars || item.stargazers_count || 0,
        forks: item.forks || item.forks_count || 0,
        currentPeriodStars: item.currentPeriodStars || item.starsSince || item.stars_today || 0,
        builtBy: item.builtBy || [],
      }))

      this.#cache.set(cacheKey, repos)
      this.#lastUpdate.set(cacheKey, now)

      return repos
    } catch (error) {
      console.error('[GitHub Trending] 所有API都失败了:', error)
      // 如果请求失败但有缓存，返回旧缓存
      if (this.#cache.has(cacheKey)) {
        console.log('[GitHub Trending] 使用缓存数据')
        return this.#cache.get(cacheKey)!
      }
      throw new Error(`GitHub Trending API 不可用: ${error}`)
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
