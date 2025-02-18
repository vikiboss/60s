import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

const headers = {
  referer: 'https://piaofang.maoyan.com/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
}

class ServiceMaoyan {
  handle(): RouterMiddleware<'/chemical'> {
    return async (ctx) => {
      const { csrfToken, deviceId } = await this.fetchVerification()

      console.log('deviceId:', deviceId)
      console.log('csrfToken:', csrfToken)

      const res = await fetch(`https://piaofang.maoyan.com/i/api/rank/globalBox/historyRankList?WuKongReady=h5`, {
        headers: { ...headers, uid: csrfToken, uuid: deviceId },
      })

      const data = await res.json()

      let currentHourDate = new Date()
      currentHourDate.setMinutes(0)
      currentHourDate.setSeconds(0)
      currentHourDate.setMilliseconds(0)

      const ret = {
        list: ((data?.data?.list || []) as MovieItem[])
          .sort((a, b) => b.rawValue - a.rawValue)
          .map((e, idx) => ({
            rank: idx + 1,
            move_maoyan_id: e.movieId,
            movie_name: e.movieName,
            release_year: e.releaseTime,
            box_office: e.rawValue,
            box_office_desc: formatBoxOffice(e.rawValue),
          })),
        tip: data?.data?.tips,
        update_time: Common.localeTime(currentHourDate),
        update_time_at: currentHourDate.getTime(),
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `${ret.list.map((e) => `${e.rank}. ${e.movie_name} (${e.release_year}) - ${e.box_office_desc}`).join('\n')}\n\n${ret.tip}`

          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(ret)
          break
      }
    }
  }

  async fetchVerification() {
    const html = await (await fetch('https://piaofang.maoyan.com/i/globalBox/historyRank', { headers })).text()

    return {
      csrfToken: html.match(/<meta name="csrf" content="(.*)">/)?.[1] ?? '',
      deviceId: html.match(/<meta name="deviceId" content="(.*)">/)?.[1] ?? '',
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
