import { Common, dayjs, TZ_SHANGHAI } from '../common.ts'
import { SolarDay } from 'tyme4ts'
import type { RouterMiddleware } from '@oak/oak'

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

function getDayOfWeek(date: string) {
  const day = new Date(date)
  return `星期${WEEK_DAYS[day.getDay()]}`
}

function getLunarDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return SolarDay.fromYmd(year, month, day).getLunarDay().toString().replace('农历', '')
}

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

    // Generate date strings for the last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => now.subtract(i, 'day').format('YYYY-MM-DD'))

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
        const dayOfWeek = getDayOfWeek(item.date)
        const lunarDate = getLunarDate(item.date)

        // Generate HTML content with proper formatting
        const newsHtml = item.news
          .map((e) => {
            const newsItem = typeof e === 'string' ? { title: e, link: '' } : e
            const newsText = this.#escapeXml(newsItem.title)

            if (newsItem.link) {
              return `<li><a href="${this.#escapeXml(newsItem.link)}" target="_blank">${newsText}</a></li>`
            }
            return `<li>${newsText}</li>`
          })
          .join('')

        const tipHtml = item.tip
          ? `<div style="margin: 24px 20px; padding: 16px 20px; background-color: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 4px;">
               <div style="color: #0066cc; font-weight: 600; font-size: 14px; margin-bottom: 8px;">💬 微语</div>
               <div style="line-height: 1.7; color: #555; font-size: 14px; font-style: italic;">${this.#escapeXml(item.tip)}</div>
             </div>`
          : ''

        const imageHtml = item.image
          ? `<div style="margin: 24px 20px; text-align: center;">
               <img src="${this.#escapeXml(item.image)}" alt="每天 60s 读懂世界" style="max-width: 100%; height: auto; border: 1px solid #e9ecef; border-radius: 6px;"/>
             </div>`
          : ''

        const description = `<![CDATA[
<div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.7;">

  <div style="padding: 0 20px; margin: 20px auto; color: #6c757d; font-size: 14px;">
    早上好，今天是 ${this.#escapeXml(dayjs(item.date).tz(TZ_SHANGHAI).format('YYYY年M月D日'))}，${this.#escapeXml(dayOfWeek)}，农历${this.#escapeXml(lunarDate)}。
  </div>

  <div style="padding: 0 20px;">
    <ol style="margin: 0; padding-left: 24px; line-height: 2; font-size: 15px; counter-reset: item;">
      ${newsHtml}
    </ol>
  </div>

  ${tipHtml}

  <div style="padding: 0 20px;">
    图片版本如下，可以复制并分享给你的好朋友，欢迎访问 <a href="https://60s-static.viki.moe?date=${this.#escapeXml(item.date)}" target="_blank">每天 60s 读懂世界</a> 获取更多信息。本 RSS 订阅由开源项目 <a href="https://github.com/vikiboss/60s" target="_blank">vikiboss/60s</a> 提供数据支持。
  </div>

  ${imageHtml}
</div>
]]>`

        return `    <item>
      <title>📅 ${item.date} ${dayOfWeek}</title>
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
    <title>每天 60s 读懂世界</title>
    <link>https://60s-static.viki.moe</link>
    <description>每天 60 秒，一图一文，读懂世界大事！</description>
    <language>zh-CN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="https://60s-api.viki.moe/v2/60s/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://60s-static.viki.moe/favicon.ico</url>
      <title>每天 60s 读懂世界</title>
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
