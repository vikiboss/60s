import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceExRate {
  #API = 'https://open.er-api.com/v6/latest'
  #cache = new Map<string, RateItem>()

  handle(): RouterMiddleware<'/ex-rate/:currency'> {
    return async ctx => {
      const currency = ctx.params.currency || 'CNY'
      const data = await this.#fetch(currency)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = Object.entries(data.rates)
            .slice(0, 20)
            .map(e => `${e[0]} => ${e[1]}`)
            .join('\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(currency = 'CNY') {
    const dayKey = Common.localeDate()
    const cache = this.#cache.get(dayKey)

    if (cache) {
      return cache
    }

    const { time_last_update_unix, time_next_update_unix, base_code, rates } = (await (
      await fetch(`${this.#API}/${currency}`)
    ).json()) as RateResponse

    const rateItem = {
      base_code,
      update_at: time_last_update_unix * 1000,
      next_update_at: time_next_update_unix * 1000,
      rates,
    }

    if (rates.length) {
      this.#cache.set(dayKey, rateItem)
    }

    return rateItem
  }
}

export const serviceExRate = new ServiceExRate()

interface RateItem {
  base_code: string
  update_at: number
  next_update_at: number
  rates: {
    [key: string]: number
  }
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
