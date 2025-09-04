import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBaidu {
  handleRealtime(): RouterMiddleware<'/baidu/realtime'> {
    return async (ctx) => {
      const data = await this.#fetchRealtime()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `百度实时热搜\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title} (${e.score_desc})`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  handleTeleplay(): RouterMiddleware<'/baidu/teleplay'> {
    return async (ctx) => {
      const data = await this.#fetchTeleplay()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `百度电视剧榜单\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title} (${e.score_desc})`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  #normalizeHtml(html: string) {
    return html.replace(/\\-/g, '-')
  }

  #formatScore(score: string) {
    const num = Number.parseInt(score, 10)
    if (num >= 10000) return `${Math.round(num / 100) / 100}w`
    return score
  }

  async #fetchRealtime() {
    const options = { headers: { 'User-Agent': Common.chromeUA } }
    const response = await fetch('https://top.baidu.com/board?tab=realtime', options)
    const rawHtml = await response.text()
    const matchResult = rawHtml.match(/<!--s-data:(.*?)-->/s)
    const data: RealtimeItem[] =
      JSON.parse(this.#normalizeHtml(matchResult?.[1] || '{}'))?.data?.cards?.[0]?.content || []

    const hotTagMap: Record<string, string | null> = {
      '0': null,
      '1': '新',
      '3': '热',
    }

    return data
      .filter((e) => !e.isTop)
      .map((e) => ({
        rank: e.index + 1,
        title: e.word,
        desc: e.desc,
        score: e.hotScore,
        score_desc: this.#formatScore(e.hotScore),
        cover: e.img || null,
        type: e.hotTag,
        type_desc: hotTagMap[e.hotTag] || null,
        type_icon: e.hotTagImg || null,
        url: e.url.startsWith('http') ? e.url : `https://www.baidu.com${e.url}`,
      }))
  }

  async #fetchTeleplay() {
    const options = { headers: { 'User-Agent': Common.chromeUA } }
    const response = await fetch('https://top.baidu.com/board?tab=teleplay', options)
    const rawHtml = await response.text()
    const matchResult = rawHtml.match(/<!--s-data:(.*?)-->/s)
    const data: TeleplayItem[] =
      JSON.parse(this.#normalizeHtml(matchResult?.[1] || '{}'))?.data?.cards?.[0]?.content || []

    return data.map((e) => ({
      rank: e.index + 1,
      title: e.word,
      desc: e.desc,
      score: e.hotScore,
      score_desc: this.#formatScore(e.hotScore),
      cover: e.img || null,
      url: e.url.startsWith('http') ? e.url : `https://www.baidu.com${e.url}`,
    }))
  }
}

export const serviceBaidu = new ServiceBaidu()

interface RealtimeItem {
  appUrl: string
  desc: string
  hotChange: string
  hotScore: string
  hotTag: string
  img: string
  index: number
  indexUrl: string
  query: string
  rawUrl: string
  show: any[]
  url: string
  word: string
  isTop?: boolean
  hotTagImg?: string
}

interface TeleplayItem {
  appUrl: string
  desc: string
  hotChange: string
  hotScore: string
  img: string
  index: number
  indexUrl: string
  query: string
  rawUrl: string
  show: string[]
  url: string
  word: string
}
