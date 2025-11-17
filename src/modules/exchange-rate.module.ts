import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceExRate {
  #cache = new Map<string, RateItem>()

  handle(): RouterMiddleware<'/exchange_rate'> {
    return async (ctx) => {
      const currency = ctx.request.url.searchParams.get('currency') || 'CNY'

      const data = await this.#fetch(currency)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `${Common.localeDate()} 的 ${currency} 汇率\n\n${data.rates
            .slice(0, 20)
            .map((e) => `${e.currency} => ${e.rate}`)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# ${currency} 汇率\n\n> 更新时间: ${data.updated}\n\n| 货币 | 汇率 |\n|------|------|\n${data.rates
            .slice(0, 30)
            .map((e) => `| **${e.currency}** | ${e.rate.toFixed(4)} |`)
            .join('\n')}\n\n*下次更新: ${data.next_updated}*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(currency = 'CNY') {
    const dayKey = `${Common.localeDate()}-${currency}`
    const cache = this.#cache.get(dayKey)

    if (cache) {
      return cache
    }

    const api = 'https://open.er-api.com/v6/latest'
    const data = (await (await fetch(`${api}/${currency}`)).json()) as RateResponse
    const { time_last_update_unix, time_next_update_unix, base_code, rates } = data

    const rateItem = {
      base_code,
      updated: Common.localeTime(time_last_update_unix * 1000),
      updated_at: time_last_update_unix * 1000,
      next_updated: Common.localeTime(time_next_update_unix * 1000),
      next_updated_at: time_next_update_unix * 1000,
      rates: Object.entries(rates).map(([key, value]) => ({
        currency: key,
        rate: value,
      })),
    }

    const count = rates ? Object.keys(rates).length : 0

    if (count > 0) {
      this.#cache.set(dayKey, rateItem)
    }

    return rateItem
  }
}

export const serviceExRate = new ServiceExRate()

interface RateItem {
  base_code: string
  updated: string
  updated_at: number
  next_updated: string
  next_updated_at: number
  rates: {
    currency: string
    rate: number
  }[]
}

interface RateResponse {
  result: string
  provider: string
  documentation: string
  terms_of_use: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  time_eol_unix: number
  base_code: string
  rates: {
    [key: string]: number
  }
}
