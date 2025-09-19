import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'

const utils = {
  parseQueryString: (qs: string) => Object.fromEntries((new URLSearchParams(qs) as any).entries()),
  md5: (input: string) => crypto.createHash('md5').update(input, 'utf8').digest('hex'),
  base64: (str: string) => Buffer.from(str, 'utf-8').toString('base64'),
}

const getMygsig = (qs: string) => {
  const sortedStr = Object.entries({ path: '/dashboard-ajax', ...utils.parseQueryString(qs) })
    .toSorted((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
    .map(([_, v]) => (typeof v === 'object' ? JSON.stringify(v) : v))
    .join('_')

  const ts = Date.now()

  return JSON.stringify({
    m1: '0.0.3',
    // m2: 0,
    // m3: '0.0.67_tool',
    ms1: utils.md5(`581409236#${sortedStr}$${ts}`),
    ts,
    // ts1: 1758274726353, // window.MyH5Guard.ts
  })
}

const getParams = () => {
  const fixedParams = { method: 'GET', key: 'A013F70DB97834C0A5492378BD76C53A' }

  const signData: Record<string, any> = {
    timeStamp: Date.now(),
    'User-Agent': utils.base64('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36'),
    index: Math.floor(Math.random() * 1000 + 1),
    channelId: 40009,
    sVersion: 2,
  }

  const signKey = utils.md5(new URLSearchParams({ ...fixedParams, ...signData }).toString().replace(/\s+/g, ' '))

  return new URLSearchParams({ ...signData, signKey })
}

export const fetchBoxOffice = async () => {
  const params = getParams()

  // params.set('orderType', '0')
  // ...其他需要的参数

  const url = `https://piaofang.maoyan.com/dashboard-ajax?${params}`
  const res = await fetch(url, { headers: { mygsig: getMygsig(params.toString()) } })
  const data = (await res.json()) as Root

  return data
}

export interface Root {
  movieList: {
    status: boolean
    data: {
      list: Array<{
        avgSeatView: string
        avgShowView: string
        boxRate: string
        boxSplitUnit: {
          num: string
          unit: string
        }
        movieInfo: {
          movieId: number
          movieName: string
          releaseInfo: string
        }
        showCount: number
        showCountRate: string
        splitBoxRate: string
        splitBoxSplitUnit: {
          num: string
          unit: string
        }
        sumBoxDesc: string
        sumSplitBoxDesc: string
      }>
      nationBoxInfo: {
        nationBoxSplitUnit: {
          num: string
          unit: string
        }
        nationSplitBoxSplitUnit: {
          num: string
          unit: string
        }
        showCountDesc: string
        title: string
        viewCountDesc: string
      }
      updateInfo: {
        updateGapSecond: number
        updateTimestamp: number
      }
    }
  }
  webList: {
    status: boolean
    data: {
      list: Array<{
        barValue: number
        currHeat: number
        currHeatDesc: string
        seriesInfo: {
          name: string
          newSeries: boolean
          platformDesc: string
          platformTxt: number
          releaseInfo: string
          seriesId: number
        }
        playCountSplitUnit?: {
          num: number
          unit: string
        }
      }>
      updateInfo: {
        updateGapSecond: number
        updateTimestamp: number
      }
    }
  }
  tvList: {
    status: boolean
    data: {
      list: Array<{
        attentionRate: number
        attentionRateDesc: string
        channelName: string
        marketRate: number
        marketRateDesc: string
        programmeName: string
      }>
      updateInfo: {
        updateGapSecond: number
        updateTimestamp: number
      }
    }
  }
  calendar: {
    today: string
    selectMinDate: string
    selectMaxDate: string
    defaultSelect: string
    serverTimestamp: string
    selectDate: string
  }
  fontStyle: string
  status: boolean
}
