import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'
import type { Service } from '../service'

interface DailyNewsItem {
  news: string[]
  link: string
  cover: string
  extra: {
    updated_at: number
    source_updated_at: string
    api_updated_at: string
  }
}

class Service60s implements Service<'/60s'> {
  #API = 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=2'
  #REG_TAG = /<[^<>]+>/g
  #REG_ITEM = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g
  #cache = new Map<string, DailyNewsItem>()
  #TIP_PREFIX = '【微语】'

  handle(): RouterMiddleware<'/60s'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.news.join('\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const today = Common.localeDateStr()
    const cachedItem = this.#cache.get(today)

    if (cachedItem) {
      return cachedItem
    }

    const ZHIHU_CK = globalThis.env?.ZHIHU_CK ?? ''

    const response = await fetch(this.#API, { headers: { cookie: ZHIHU_CK } })
    const { data = [] } = (await response.json()) || {}

    const { url: link, title_image: cover, updated: updatedAt, content = '' } = data.at(0) || {}

    const items = ((content.match(this.#REG_ITEM) || []) as string[])
      .map(e => this.#transferText(e.replace(this.#REG_TAG, '').trim()))
      .map(e => e.replace(/(^\d+、\s*)|([。！～；]$)/g, ''))
      .filter(e => e.length > 6)

    const todayInData = Common.localeDateStr(updatedAt * 1000)
    const news = items.filter(e => !e.includes(this.#TIP_PREFIX))
    const tip = items.find(e => e.includes(this.#TIP_PREFIX)) || ''

    const item = {
      cover,
      news,
      tip: tip.replace(this.#TIP_PREFIX, '').trim(),
      link,
      extra: {
        updated_at: updatedAt * 1000,
        source_updated_at: Common.localeTimeStr(updatedAt * 1000),
        api_updated_at: Common.localeTimeStr(),
      },
    }

    // 有数据，且是今天的数据
    if (items.length && todayInData === today) {
      this.#cache.set(today, item)
    }

    return item
  }

  #transferText(str: string, mode: 'u2a' | 'a2u' = 'a2u') {
    if (mode === 'a2u') {
      return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
    }

    return str.replace(/./, _ => `&#${_.charCodeAt(0)};`)
  }
}

export const service60s = new Service60s()
