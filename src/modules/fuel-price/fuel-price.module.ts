import regions from './regions.json' with { type: 'json' }
import { load } from 'cheerio'
import { Common } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

type FuelRegion = (typeof regions)[number]

const sortedRegion = regions.toSorted((a, b) => a.region.length - b.region.length)

interface FuelPrice {
  name: string
  price: number
  price_desc: string
}

interface FuelTrend {
  /** 下次调价日期，如 "2月24日24时" */
  next_adjustment_date: string
  /** 涨跌方向: 上调 / 下调 / 搁浅 */
  direction: string
  /** 每吨变化量（元），如 110 */
  change_ton: number
  /** 每吨变化描述，如 "上调110元/吨" */
  change_ton_desc: string
  /** 每升最小变化量（元），如 0.08 */
  change_liter_min: number
  /** 每升最大变化量（元），如 0.10 */
  change_liter_max: number
  /** 每升变化描述，如 "0.08元/升-0.10元/升" */
  change_liter_desc: string
  /** 完整描述 */
  description: string
}

class ServiceFuelPrice {
  #BASE_URL: string = 'http://www.qiyoujiage.com'

  private cache = new Map<string, { ts: number; items: FuelPrice[]; trend: FuelTrend | null }>()
  // 60 minutes
  private readonly CACHE_TTL_MS = 60 * 60 * 1000

  handle(): RouterMiddleware<'/fuel/price'> {
    return async (ctx) => {
      try {
        const queryRegion = ctx.request.url.searchParams.get('region') || '北京'
        const forceUpdate = !!ctx.request.url.searchParams.get('force-update')
        const target = sortedRegion.find((e) => e.region.endsWith(queryRegion))

        if (!target) {
          ctx.response.body = Common.buildJson(null, 400, `暂不支持 ${queryRegion} 区域查询`)
          return
        }

        const { items, trend, ts } = await this.#fetch(target, forceUpdate)

        const data = {
          region: target.region,
          trend,
          items,
          link: `${this.#BASE_URL}${target.url}`,
          updated: Common.localeTime(ts),
          updated_at: ts,
        }

        const trendText = data.trend ? `\n\n${data.trend.description}` : ''

        switch (ctx.state.encoding) {
          case 'text': {
            ctx.response.body = `今日油价 (${queryRegion})\n\n${data.items
              .map((e) => `${e.name}: ${e.price_desc}`)
              .join('\n')}${trendText}\n\n更新时间: ${data.updated}`
            break
          }

          case 'markdown': {
            ctx.response.body = `# 今日油价 (${queryRegion})\n\n${data.items
              .map((e) => `- **${e.name}**: ${e.price_desc}`)
              .join('\n')}${data.trend ? `\n\n> ${data.trend.description}` : ''}\n\n更新时间: ${data.updated}`
            break
          }

          case 'json':
          default: {
            ctx.response.body = Common.buildJson(data)
            break
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        ctx.response.body = Common.buildJson({ error: message }, 500, message)
      }
    }
  }

  async #fetch(
    region: FuelRegion,
    forceUpdate: boolean = false,
  ): Promise<{ ts: number; items: FuelPrice[]; trend: FuelTrend | null }> {
    const cacheKey = `FUEL_PRICE_${region.url}`

    if (forceUpdate) {
      this.cache.delete(cacheKey)
    }

    const cachedEntry = this.cache.get(cacheKey)
    const isCacheValid = cachedEntry && Date.now() - cachedEntry.ts > this.CACHE_TTL_MS

    if (isCacheValid) {
      return cachedEntry
    }

    const response = await fetch(`${this.#BASE_URL}${region.url}`, { headers: { 'User-Agent': Common.chromeUA } })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const data = { ts: Date.now(), items: this.parsePrices(html), trend: this.parseTrend(html) }

    this.cache.set(cacheKey, data)

    return data
  }

  parsePrices(html: string): FuelPrice[] {
    const $ = load(html)
    const items: FuelPrice[] = []

    $('#youjia dl').each((_, dl) => {
      const $dl = $(dl)
      const dts = $dl.find('dt')
      const dds = $dl.find('dd')

      dts.each((i, dt) => {
        const name = $(dt)
          .text()
          .trim()
          .replace(/^[^0-9]+/, '')
        const priceText = $(dds[i]).text().trim()
        const price = parseFloat(priceText)

        items.push({
          name,
          price,
          price_desc: `${price.toFixed(2)} 元/升`,
        })
      })
    })

    return items
  }

  parseTrend(html: string): FuelTrend | null {
    const $ = load(html)

    // The trend info is in a styled div inside #youjiaCont, or in the first styled div on the homepage
    const trendDiv = $('#youjiaCont > div')
      .filter((_, el) => {
        const style = $(el).attr('style') || ''
        return style.includes('border') && style.includes('#EA5146')
      })
      .first()

    // Fallback: homepage uses a different structure
    const trendText = trendDiv.length ? trendDiv.text() : $('#left > div').first().text()

    if (!trendText) return null

    const dateMatch = trendText.match(/下次油价(\d+月\d+日\d+时)调整/)
    const directionMatch = trendText.match(/预计(上调|下调|搁浅)/)
    const tonMatch = trendText.match(/(上调|下调)(\d+)元\/吨/)
    const literMatch = trendText.match(/\((\d+\.?\d*)元\/升[-~](\d+\.?\d*)元\/升\)/)

    if (!dateMatch && !directionMatch) return null

    const direction = directionMatch ? directionMatch[1] : '搁浅'
    const nextDate = dateMatch ? dateMatch[1] : ''
    const changeTon = tonMatch ? parseInt(tonMatch[2], 10) : 0
    const changeLiterMin = literMatch ? parseFloat(literMatch[1]) : 0
    const changeLiterMax = literMatch ? parseFloat(literMatch[2]) : 0

    const changeTonDesc = tonMatch ? `${direction}${tonMatch[2]}元/吨` : ''
    const changeLiterDesc =
      changeLiterMin && changeLiterMax ? `${changeLiterMin.toFixed(2)}元/升-${changeLiterMax.toFixed(2)}元/升` : ''

    const descParts: string[] = []
    if (nextDate) descParts.push(`下次调价时间: ${nextDate}`)
    if (direction !== '搁浅') {
      descParts.push(`预计${changeTonDesc}${changeLiterDesc ? ' (' + changeLiterDesc + ')' : ''}`)
    } else {
      descParts.push('预计搁浅（不调整）')
    }

    return {
      next_adjustment_date: nextDate,
      direction,
      change_ton: changeTon,
      change_ton_desc: changeTonDesc,
      change_liter_min: changeLiterMin,
      change_liter_max: changeLiterMax,
      change_liter_desc: changeLiterDesc,
      description: descParts.join('，'),
    }
  }
}

export const serviceFuelPrice = new ServiceFuelPrice()
