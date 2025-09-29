import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { create } from 'fontkit'
import { dayjs } from '../../common.ts'
import numCommandsMap from './num-commands.json' with { type: 'json' }

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

  return transformFormat(await processFont(data))
}

function transformFormat(data: Root) {
  return {
    movie: {
      title: data.movieList.data.nationBoxInfo.title,
      show_count_desc: data.movieList.data.nationBoxInfo.showCountDesc,
      view_count_desc: data.movieList.data.nationBoxInfo.viewCountDesc,
      split_box_office: data.movieList.data.nationBoxInfo.nationBoxSplitUnit.num,
      split_box_office_unit: data.movieList.data.nationBoxInfo.nationSplitBoxSplitUnit.unit,
      box_office: data.movieList.data.nationBoxInfo.nationBoxSplitUnit.num,
      box_office_unit: data.movieList.data.nationBoxInfo.nationBoxSplitUnit.unit,
      update_gap_second: data.movieList.data.updateInfo.updateGapSecond,
      updated: dayjs(data.movieList.data.updateInfo.updateTimestamp).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: data.movieList.data.updateInfo.updateTimestamp,
      list: data.movieList.data.list.map((item) => ({
        movie_id: item.movieInfo.movieId,
        movie_name: item.movieInfo.movieName,
        release_info: item.movieInfo.releaseInfo,

        box_office: item.boxSplitUnit.num,
        box_office_unit: item.boxSplitUnit.unit,
        box_office_desc: `${item.boxSplitUnit.num}${item.boxSplitUnit.unit}`,
        box_office_rate: item.boxRate,

        split_box_office: item.splitBoxSplitUnit.num,
        split_box_office_unit: item.splitBoxSplitUnit.unit,
        split_box_office_desc: `${item.splitBoxSplitUnit.num}${item.splitBoxSplitUnit.unit}`,
        split_box_office_rate: item.splitBoxRate,

        show_count: item.showCount,
        show_count_rate: item.showCountRate,

        avg_show_view: item.avgShowView,
        avg_seat_view: item.avgSeatView,

        sum_box_desc: item.sumBoxDesc,
        sum_split_box_desc: item.sumSplitBoxDesc,
      })),
    },
    tv: {
      update_gap_second: data.tvList.data.updateInfo.updateGapSecond,
      updated: dayjs(data.tvList.data.updateInfo.updateTimestamp).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: data.tvList.data.updateInfo.updateTimestamp,
      list: data.tvList.data.list.map((item) => ({
        programme_name: item.programmeName,
        channel_name: item.channelName,
        market_rate: item.marketRate,
        market_rate_desc: item.marketRateDesc,
        attention_rate: item.attentionRate,
        attention_rate_desc: item.attentionRateDesc,
      })),
    },
    web: {
      update_gap_second: data.webList.data.updateInfo.updateGapSecond,
      updated: dayjs(data.webList.data.updateInfo.updateTimestamp).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: data.webList.data.updateInfo.updateTimestamp,
      list: data.webList.data.list.map((item) => ({
        series_id: item.seriesInfo.seriesId,
        series_name: item.seriesInfo.name,
        release_info: item.seriesInfo.releaseInfo,
        platform_desc: item.seriesInfo.platformDesc,
        platform_txt: item.seriesInfo.platformTxt,
        curr_heat: item.currHeat,
        curr_heat_desc: item.currHeatDesc,
        bar_value: item.barValue,
      })),
    },
  }
}

async function processFont(data: Root): Promise<Root> {
  const fontUrl = extractWoffUrl(data.fontStyle)

  if (!fontUrl) {
    throw new Error('Font URL not found')
  }

  const buffer = Buffer.from(await (await fetch(fontUrl)).arrayBuffer())
  const font = create(buffer)

  if (font.type !== 'WOFF') {
    throw new Error('Font type is not WOFF')
  }

  const numbers: { unicode: string; num: number }[] = []

  for (let codePoint of font.characterSet) {
    const glyph = font.glyphForCodePoint(codePoint)
    const unicode = `&#x${codePoint.toString(16).toLowerCase().padStart(4, '0')};`
    const commands = glyph.path.commands

    const num =
      numCommandsMap.find((e) => e.commandsList.some((e) => e.every((e, idx) => e === commands[idx].command)))?.num ??
      null

    if (num !== null) {
      numbers.push({ unicode, num })
    }
  }

  const skipNum = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => !numbers.find((e) => e.num === n)) ?? '*'

  for (const item of data.movieList.data.list) {
    item.boxSplitUnit.num = item.boxSplitUnit.num.replace(/&#x[0-9a-f]{4};/g, (match) => {
      const found = numbers.find((n) => n.unicode === match)
      return found ? found.num.toString() : String(skipNum)
    })

    item.splitBoxSplitUnit.num = item.splitBoxSplitUnit.num.replace(/&#x[0-9a-f]{4};/g, (match) => {
      const found = numbers.find((n) => n.unicode === match)
      return found ? found.num.toString() : String(skipNum)
    })
  }

  return data
}

function extractWoffUrl(cssString) {
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.woff");}

  // 匹配 url("//...woff") 或 url('//...woff') 格式
  const woffRegex = /url\(["']?(\/\/[^"'()]*\.woff[^"'()]*?)["']?\)/gi
  const match = cssString.match(woffRegex)

  if (match && match.length > 0) {
    // 提取URL并添加https前缀
    const url = match[0]
      .replace(/url\(["']?/, '') // 移除 url(" 或 url('
      .replace(/["']?\)$/, '') // 移除 ") 或 ')
      .trim()

    return url.startsWith('//') ? 'https:' + url : url
  }

  return null
}

export interface Root {
  movieList: {
    status: boolean
    data: {
      list: {
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
      }[]
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
      list: {
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
      }[]
      updateInfo: {
        updateGapSecond: number
        updateTimestamp: number
      }
    }
  }
  tvList: {
    status: boolean
    data: {
      list: {
        attentionRate: number
        attentionRateDesc: string
        channelName: string
        marketRate: number
        marketRateDesc: string
        programmeName: string
      }[]
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
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/20a70494.woff");}
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/432017e7.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/432017e7.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/432017e7.woff");}
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/2a70c44b.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/2a70c44b.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/2a70c44b.woff");}
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/75e5b39d.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/75e5b39d.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/75e5b39d.woff");}
  // @font-face{font-family: "mtsi-font";src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/e3dfe524.eot");src:url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/e3dfe524.eot?#iefix") format("embedded-opentype"),url("//s3plus.meituan.net/v1/mss_73a511b8f91f43d0bdae92584ea6330b/font/e3dfe524.woff");}
  fontStyle: string
  status: boolean
}
