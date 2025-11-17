import { Common } from '../common.ts'
import { load } from 'cheerio'

import type { RouterMiddleware } from '@oak/oak'

class ServiceAINews {
  #cache = new Map<string, AINewsItem>()

  handle(): RouterMiddleware<'/ai-news'> {
    return async (ctx) => {
      const date = ctx.request.url.searchParams.get('date')
      const all = ctx.request.url.searchParams.has('all')
      const data = await this.#fetch(date, all)

      const isToday = !date || date === Common.localeDate(Date.now()).replace(/\//g, '-')

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `AI 资讯快报（${data.date}${isToday ? '，实时更新' : ''}）\n\n${
            data.news.length > 0
              ? data.news
                  .map((e, idx) => `${idx + 1}. ${e.title}\n\n${e.detail}（来自: ${e.source}）\n\n> 详情: ${e.link}`)
                  .join('\n\n')
              : '今日暂无重大 AI 资讯'
          }`
          break
        }

        case 'markdown': {
          ctx.response.body = `# AI 资讯快报\n\n> ${data.date}${isToday ? ' · 实时更新' : ''}\n\n${
            data.news.length > 0
              ? data.news
                  .map(
                    (e, idx) =>
                      `### ${idx + 1}. [${e.title}](${e.link})\n\n${e.detail}\n\n**来源**: ${e.source}\n\n---\n`,
                  )
                  .join('\n')
              : '*今日暂无重大 AI 资讯*'
          }`
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

  async #fetch(date?: string | null, all = false): Promise<AINewsItem> {
    const today = date || Common.localeDate(Date.now()).replace(/\//g, '-')
    const cacheKey = all ? 'all' : today
    const cachedItem = this.#cache.get(cacheKey)

    try {
      const response = await fetch('https://ai-bot.cn/daily-ai-news/', {
        headers: { 'User-Agent': Common.chromeUA },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const data = this.parseHTML(html, today, all)

      this.#cache.set(cacheKey, data)
      return data
    } catch (error) {
      if (cachedItem) {
        return cachedItem
      }
      throw new Error(`Failed to fetch AI news: ${error}`)
    }
  }

  parseHTML(html: string, requestDate: string, all = false): AINewsItem {
    const $ = load(html)
    const news: NewsItem[] = []

    $('.news-date').each((_, dateEl) => {
      const $dateEl = $(dateEl)
      const dateText = $dateEl.text().trim()

      const $siblings = $dateEl.siblings('.news-item')

      $siblings.each((_, itemEl) => {
        const $item = $(itemEl)
        const $content = $item.find('.news-content')

        const title = $content.find('h2 a').text().trim()
        const link = $content.find('h2 a').attr('href') || ''
        const detail = $content
          .find('p.text-muted')
          .contents()
          .filter(function () {
            return this.type === 'text'
          })
          .text()
          .trim()

        const source = $content.find('.news-time').text().replace('来源：', '').trim()

        if (title) {
          news.push({
            title,
            detail: detail || '',
            link: link.startsWith('http') ? link : `https://ai-bot.cn${link}`,
            source,
            date: this.normalizeDateText(dateText, requestDate),
          })
        }
      })
    })

    let filteredNews: NewsItem[] = []

    if (all) {
      filteredNews = news
    } else if (requestDate) {
      // 直接使用标准化日期进行匹配
      filteredNews = news.filter((item) => item.date === requestDate)
    }

    return {
      date: all ? 'all' : requestDate,
      news: filteredNews,
    }
  }

  /**
   * 标准化日期文本，将 "8月4·周一" 格式转换为 "2024-08-04" 格式
   * @param dateText - 原始日期文本，如 "8月4·周一"
   * @param requestDate - 请求的日期，用于获取年份，格式如 "2024-08-04"
   * @returns 标准化的日期字符串，格式为 "YYYY-MM-DD"
   */
  private normalizeDateText(dateText: string, requestDate: string): string {
    if (!dateText) return requestDate

    // 提取月日信息，支持 "8月4·周一" 或 "8月4日·周一" 格式
    const match = dateText.match(/(\d+)月(\d+)[日·]/)
    if (!match) return requestDate

    const month = parseInt(match[1], 10)
    const day = parseInt(match[2], 10)

    // 从 requestDate 获取年份，如果没有则使用当前年份
    let year = new Date().getFullYear()
    if (requestDate && requestDate.includes('-')) {
      const dateParts = requestDate.split('-')
      if (dateParts.length >= 1) {
        year = parseInt(dateParts[0], 10) || year
      }
    }

    // 格式化为标准日期字符串
    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')

    return `${year}-${monthStr}-${dayStr}`
  }
}

export const serviceAINews = new ServiceAINews()

interface NewsItem {
  title: string
  detail: string
  link: string
  source?: string
  date?: string
}

interface AINewsItem {
  date: string
  news: NewsItem[]
}
