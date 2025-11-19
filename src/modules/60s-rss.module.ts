import { Common, dayjs, TZ_SHANGHAI } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

interface DailyNewsItem {
  date: string
  news: { title: string; link: string }[]
  tip: string
  image: string
}

class Service60sRss {
  #cache = new Map<string, DailyNewsItem>()

  handle(): RouterMiddleware<'/60s/rss'> {
    return async (ctx) => {
      const items = await this.#fetchLast10Days()
      const rssXml = this.#generateRSS(items)

      ctx.response.type = 'application/xml'
      ctx.response.body = rssXml
    }
  }

  async #tryUrl(date: string): Promise<DailyNewsItem | null> {
    const response = await Common.tryRepoUrl({
      repo: 'vikiboss/60s-static-host',
      path: `static/60s/${date}.json`,
      alternatives: [
        `https://60s-static.viki.moe/60s/${date}.json`,
        `https://60s-static-host.vercel.app/60s/${date}.json`,
      ],
    })

    if (!response || !response.ok) return null

    const data = await response.json()
    if (!data?.news?.length) return null

    return data as DailyNewsItem
  }

  async #fetchLast10Days(): Promise<DailyNewsItem[]> {
    const now = dayjs().tz(TZ_SHANGHAI)

    // Generate date strings for the last 5 days
    const dates = Array.from({ length: 5 }, (_, i) => now.subtract(i, 'day').format('YYYY-MM-DD'))

    // Fetch all dates in parallel
    const results = await Promise.all(
      dates.map(async (dateStr) => {
        try {
          // Check cache first
          const cached = this.#cache.get(dateStr)
          if (cached) return cached

          // Try to fetch data
          const data = await this.#tryUrl(dateStr)
          if (data) {
            this.#cache.set(dateStr, data)
            return data
          }
          return null
        } catch (error) {
          // Log error but don't fail the entire request
          console.error(`Failed to fetch data for ${dateStr}:`, error)
          return null
        }
      }),
    )

    // Filter out null results and return
    return results.filter((item): item is DailyNewsItem => item !== null)
  }

  #generateRSS(items: DailyNewsItem[]): string {
    const now = dayjs().tz(TZ_SHANGHAI)
    const buildDate = now.format('ddd, DD MMM YYYY HH:mm:ss ZZ')

    const itemsXml = items
      .map((item) => {
        const pubDate = dayjs(item.date).tz(TZ_SHANGHAI).format('ddd, DD MMM YYYY 00:00:00 ZZ')
        const link = `https://60s-static.viki.moe?date=${item.date}`

        // Generate description text (similar to text format)
        const newsText = item.news
          .map((e, idx) => {
            const newsItem = typeof e === 'string' ? e : e.title
            return `${idx + 1}. ${newsItem}`
          })
          .join('\n')

        const tipText = item.tip ? `\n\n【微语】${item.tip}` : ''
        const imageHtml = item.image ? `<br/><br/><img src="${this.#escapeXml(item.image)}" alt="每天 60s 看世界"/>` : ''

        const description = `<![CDATA[
<pre>${this.#escapeXml(newsText)}${this.#escapeXml(tipText)}</pre>${imageHtml}
]]>`

        return `    <item>
      <title>每天 60s 看世界 - ${item.date}</title>
      <link>${this.#escapeXml(link)}</link>
      <guid isPermaLink="true">${this.#escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>每天 60s 看世界</title>
    <link>https://60s-static.viki.moe</link>
    <description>每天 60 秒读懂世界</description>
    <language>zh-CN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="https://60s-api.viki.moe/v2/60s/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://60s-static.viki.moe/favicon.ico</url>
      <title>每天 60s 看世界</title>
      <link>https://60s-static.viki.moe</link>
    </image>
${itemsXml}
  </channel>
</rss>`
  }

  #escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

export const service60sRss = new Service60sRss()
