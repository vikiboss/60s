import { Common } from '../../common.ts'
import { load } from 'cheerio'
import type { RouterMiddleware } from '@oak/oak'
import fuelPriceRegions from './fuel-price.json' with { type: 'json' }

const BASE_URL: string = 'http://www.qiyoujiage.com'

class ServiceFuelPrice {
  private cache = new Map<string, CacheFuelPrice>()
  // 60 minutes
  private readonly CACHE_TTL_MS = 60 * 60 * 1000

  handle(): RouterMiddleware<'/hacker-news'> {
    return async (ctx) => {
      const region = await Common.getParam('region', ctx.request)

      const fuelRegions: FuelRegion[] = fuelPriceRegions[region]
      if (!fuelRegions) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, `暂不支持 ${region} 区域查询`)
        return
      }

      // 是否需要强制刷新缓存
      const forceUpdate = !!(await Common.getParam('force-update', ctx.request))

      const list = await this.#fetch(region, fuelRegions, forceUpdate)
      const data = {
        list: list,
        update_time: Common.localeTime(),
        update_time_at: new Date().getTime(),
      }
      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `今日油价\n\n${data.list
            .map((e, idx) => `${idx + 1}. ${e.fullArea}\n${e.fuelPrices.map(i => `${i.name}: ${i.price}`).join("\n")}`)
            .join('\n\n')}`
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

  async #fetch(region: string, fuelRegions: FuelRegion[], forceUpdate: boolean = false): Promise<AreaFuelPrices[]> {
    // 生成唯一的缓存键
    const cacheKey = `fuel-price-${region}`

    if (!forceUpdate) {
      // 检查是否存在有效缓存
      const cachedEntry = this.cache.get(cacheKey)
      if (cachedEntry) {
        const isExpired = Date.now() - cachedEntry.timestamp > this.CACHE_TTL_MS
        if (!isExpired) {
          return cachedEntry.items
        }
        // 如果缓存已过期，从 cache 中删除
        this.cache.delete(cacheKey)
      }
    } else {
      // 强制刷新缓存
      this.cache.delete(cacheKey)
    }

    try {
      const result: AreaFuelPrices[] = []

      for (let fuelRegion of fuelRegions) {
        const response = await fetch(`${BASE_URL}${fuelRegion.url}`, {
          headers: {
            'User-Agent': Common.chromeUA,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const html = await response.text()
        const data = this.parseHTML(html, region)

        result.push({
          fullArea: fuelRegion.fullArea,
          fuelPrices: data
        })
      }

      // 将新数据和当前时间戳存入缓存
      const newCachedEntry: CacheFuelPrice = {
        items: result,
        timestamp: Date.now(),
      }
      this.cache.set(cacheKey, newCachedEntry)

      return result
    } catch (error) {
      throw new Error(`Failed to fetch fuel price: ${error}`)
    }
  }

  parseHTML(html: string, region: string): FuelPrice[] {
    const $ = load(html)

    const fuelPrices: FuelPrice[] = []

    $('#youjia dl').each((_, dl) => {
      const $dl = $(dl)
      const dts = $dl.find('dt')
      const dds = $dl.find('dd')

      dts.each((i, dt) => {
        const name = $(dt).text().trim().replace(region, '')
        const priceText = $(dds[i]).text().trim()
        const price = parseFloat(priceText)

        fuelPrices.push({ name, price })
      })
    })

    return fuelPrices
  }
}

export const serviceFuelPrice = new ServiceFuelPrice()

interface FuelRegion {
  fullArea: string
  url: string
}

interface AreaFuelPrices {
  fullArea: string
  fuelPrices: FuelPrice[]
}

interface FuelPrice {
  name: string
  price: number
}

interface CacheFuelPrice {
  items: AreaFuelPrices[]
  timestamp: number
}