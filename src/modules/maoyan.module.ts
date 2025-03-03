import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

const headers = {
  referer: 'https://piaofang.maoyan.com/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
}

class ServiceMaoyan {
  handle(): RouterMiddleware<'/maoyan'> {
    return async ctx => {
      const { list, tips } = await this.fetchHTMLData()

      const ret = {
        list: list
          .sort((a, b) => b.rawValue - a.rawValue)
          .map((e, idx) => ({
            rank: idx + 1,
            maoyan_id: e.movieId,
            movie_name: e.movieName,
            release_year: e.releaseTime,
            box_office: e.rawValue,
            box_office_desc: formatBoxOffice(e.rawValue),
          })),
        tip: tips,
        update_time: Common.localeTime(),
        update_time_at: new Date().getTime(),
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `全球电影票房总榜（猫眼）\n\n${ret.list
            .map(e => `${e.rank}. ${e.movie_name} (${e.release_year}) - ${e.box_office_desc}`)
            .join('\n')}\n\n${ret.tip}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(ret)
          break
      }
    }
  }

  async fetchHTMLData() {
    const html = await (
      await fetch('https://piaofang.maoyan.com/i/globalBox/historyRank', { headers })
    ).text()
    const json = /var props = (\{.*?\});/.exec(html)?.[1] || '{}'
    const data = JSON.parse(json)?.data || {}

    return {
      uid: /name="csrf"\s+content="([^"]+)"/.exec(html)?.[1] ?? '',
      uuid: /name="deviceId"\s+content="([^"]+)"/.exec(html)?.[1] ?? '',
      list: (data?.detail?.list || []) as MovieItem[],
      tips: (data?.detail?.tips || '') as string,
    }
  }
}

export const serviceMaoyan = new ServiceMaoyan()

interface MovieItem {
  box: string
  force: boolean
  movieId: number
  movieName: string
  rawValue: number
  releaseTime: string
}

function formatBoxOffice(boxOffice: number | string, decimals: number = 2): string {
  if (typeof decimals !== 'number' || decimals < 0) {
    throw new Error('decimals must be a non-negative number')
  }

  const amount = Number(boxOffice)
  if (Number.isNaN(amount)) throw new Error('Invalid input: boxOffice must be a valid number')

  const UNIT_WAN = 10 ** 4
  const UNIT_YI = 10 ** 8
  const UNIT_WAN_YI = 10 ** 12

  const formatNumber = (num: number): string => num.toFixed(decimals).replace(/\.?0+$/, '')

  if (amount < UNIT_WAN) {
    return `${formatNumber(amount)}元`
  } else if (amount < UNIT_YI) {
    return `${formatNumber(amount / UNIT_WAN)}万元`
  } else if (amount < UNIT_WAN_YI) {
    return `${formatNumber(amount / UNIT_YI)}亿元`
  } else {
    return `${formatNumber(amount / UNIT_WAN_YI)}万亿元`
  }
}
