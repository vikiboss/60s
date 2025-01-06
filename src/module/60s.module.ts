import { Common } from '../common'

import type { Middleware } from '@oak/oak'
import type { Service } from '../types'

interface DailyNewsItem {
  news: string[]
  link: string
  cover: string
  updatedAt: number
  apiUpdatedAt: string
}

class Service60s implements Service {
  constructor(private cache: Map<string, DailyNewsItem> = new Map()) {}

  handle(): Middleware {
    return async ctx => {
      const data = await this.#fetch60s()
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

  async #fetch60s() {
    const today = Common.localeDateStr()
    const cachedItem = this.cache.get(today)

    if (cachedItem) {
      return cachedItem
    }

    const ZHIHU_CK = globalThis.env?.ZHIHU_CK ?? ''

    const api = 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=2'
    const itemReg = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g
    const tagReg = /<[^<>]+>/g

    const response = await fetch(api, { headers: { cookie: ZHIHU_CK } })
    const { data = [] } = (await response.json()) || {}

    const todayData = data.at(0)

    if (!todayData) {
      return { news: [], link: '', cover: '', updatedAt: 0, apiUpdatedAt: '' }
    }

    const rawNews: string[] = todayData?.content?.match(itemReg) ?? []
    const news = rawNews.map((e: string) => this.#transferText(e.replace(tagReg, '').trim(), 'a2u'))
    const todayInData = Common.localeDateStr(todayData?.updated * 1000)

    const item = {
      news,
      link: todayData.url,
      cover: todayData.title_image,
      updatedAt: todayData.updated * 1000,
      apiUpdatedAt: Common.localeTimeStr(),
    }

    if (news.length && todayInData === today) {
      this.cache.set(today, item)
    }

    return item
  }

  #transferText(str: string, mode: 'u2a' | 'a2u') {
    if (mode === 'a2u') {
      return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
    }
    return str.replace(/./, _ => `&#${_.charCodeAt(0)};`)
  }
}

export const service60s = new Service60s()
