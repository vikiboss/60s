import { Common } from '../common.ts'

import type { AppContext } from '../types.ts'

class ServiceKfc {
  private lastFetchTime = 0
  private cacheDuration = 1 * 24 * 60 * 60 * 1000 // 缓存 1 天
  private cache: string[] = []

  async handle(ctx: AppContext) {
    const list = await this.#fetch()
    const result = Common.randomItem(list)

    switch (ctx.encoding) {
      case 'text': {
        return result
      }

      case 'markdown': {
        return `# 🍗 疯狂星期四文案\n\n${result}\n\n---\n\n*v50 文案第 ${list.findIndex((item: string) => item === result) + 1} 条*`
      }

      case 'json':
      default: {
        return Common.buildJson({
          index: list.findIndex((item: string) => item === result),
          kfc: result,
        })
      }
    }
  }

  async #fetch() {
    if (this.cache && Date.now() - this.lastFetchTime <= this.cacheDuration) {
      return this.cache
    }

    const response = await Common.tryRepoUrl({
      repo: 'vikiboss/v50',
      path: 'static/v50.json',
      alternatives: [`https://v50.deno.dev/list`],
    })

    if (!response) return []

    const data = (await response.json()) as string[]

    if (data?.length > 0) {
      this.cache = data
      this.lastFetchTime = Date.now()
    }

    return data || []
  }
}

export const serviceKfc = new ServiceKfc()
