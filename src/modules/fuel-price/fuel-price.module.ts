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

class ServiceFuelPrice {
  #BASE_URL: string = 'http://www.qiyoujiage.com'

  private cache = new Map<string, { ts: number; items: FuelPrice[] }>()
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

        const { items, ts } = await this.#fetch(target, forceUpdate)

        const data = {
          region: target.region,
          items,
          link: `${this.#BASE_URL}${target.url}`,
          updated: Common.localeTime(ts),
          updated_at: ts,
        }

        switch (ctx.state.encoding) {
          case 'text': {
            ctx.response.body = `今日油价 (${queryRegion})\n\n${data.items
              .map((e) => `${e.name}: ${e.price_desc}`)
              .join('\n')}\n\n更新时间: ${data.updated}`
            break
          }

          case 'markdown': {
            ctx.response.body = `# 今日油价 (${queryRegion})\n\n${data.items
              .map((e) => `- **${e.name}**: ${e.price_desc}`)
              .join('\n')}\n\n更新时间: ${data.updated}`
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

  async #fetch(region: FuelRegion, forceUpdate: boolean = false): Promise<{ ts: number; items: FuelPrice[] }> {
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
    const data = { ts: Date.now(), items: this.parseHTML(html) }

    this.cache.set(cacheKey, data)

    return data
  }

  parseHTML(html: string): FuelPrice[] {
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
}

export const serviceFuelPrice = new ServiceFuelPrice()
