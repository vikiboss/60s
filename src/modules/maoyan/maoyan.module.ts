import { Common, dayjs } from '../../common.ts'
import { fetchBoxOffice } from './encode.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceMaoyan {
  handleAllMovie(): RouterMiddleware<'/maoyan/all/movie'> {
    return async (ctx) => {
      const { list, tips } = await this.fetchHTMLData()

      const data = {
        list: list
          .toSorted((a, b) => b.rawValue - a.rawValue)
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
          ctx.response.body = `全球电影票房总榜（猫眼）\n\n${data.list
            .map((e) => `${e.rank}. ${e.movie_name} (${e.release_year}) - ${e.box_office_desc}`)
            .slice(0, 20)
            .join('\n')}\n\n${data.tip}`
          break

        case 'markdown':
          ctx.response.body = `# 🎬 全球电影票房总榜\n\n| 排名 | 电影名称 | 上映年份 | 票房 |\n|------|----------|----------|------|\n${data.list
            .slice(0, 20)
            .map((e) => `| ${e.rank} | ${e.movie_name} | ${e.release_year} | ${e.box_office_desc} |`)
            .join('\n')}\n\n${data.tip ? `> ${data.tip}\n\n` : ''}*更新时间: ${data.update_time}*\n\n*数据来源: 猫眼专业版*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  handleRealtime(type: 'movie' | 'tv' | 'web'): RouterMiddleware<'/maoyan/movie'> {
    return async (ctx) => {
      const data = await fetchBoxOffice()

      switch (ctx.state.encoding) {
        case 'text': {
          switch (type) {
            case 'movie':
            default: {
              ctx.response.body = `今日实时票房排行 (${dayjs().format('M/D HH:mm')})\n\n${data.movie.list
                .map((e, idx) => `${idx + 1}. ${e.movie_name} - ${e.box_office_desc}/${e.release_info}`)
                .slice(0, 20)
                .join('\n')}\n\n数据来源：猫眼专业版`
              break
            }

            case 'tv': {
              ctx.response.body = `今日实时电视收视排行 (${dayjs().format('M/D HH:mm')})\n\n${data.tv.list
                .map((e, idx) => `${idx + 1}. ${e.programme_name} - ${e.channel_name}/${e.market_rate.toFixed(2)}%`)
                .slice(0, 20)
                .join('\n')}\n\n数据来源：猫眼专业版`
              break
            }

            case 'web': {
              ctx.response.body = `今日实时网播热度排行 (${dayjs().format('M/D HH:mm')})\n\n${data.web.list
                .map((e, idx) => `${idx + 1}. ${e.series_name} - ${e.curr_heat_desc}/${e.release_info}`)
                .slice(0, 20)
                .join('\n')}\n\n数据来源：猫眼专业版`
              break
            }
          }

          break
        }

        case 'markdown': {
          switch (type) {
            case 'movie':
            default: {
              ctx.response.body = `# 🎬 今日实时票房排行\n\n*更新时间: ${dayjs().format('M/D HH:mm')}*\n\n| 排名 | 电影名称 | 实时票房 | 上映信息 |\n|------|----------|----------|----------|\n${data.movie.list
                .slice(0, 20)
                .map((e, idx) => `| ${idx + 1} | ${e.movie_name} | ${e.box_office_desc} | ${e.release_info} |`)
                .join('\n')}\n\n*数据来源: 猫眼专业版*`
              break
            }

            case 'tv': {
              ctx.response.body = `# 📺 今日实时电视收视排行\n\n*更新时间: ${dayjs().format('M/D HH:mm')}*\n\n| 排名 | 节目名称 | 频道 | 收视率 |\n|------|----------|------|--------|\n${data.tv.list
                .slice(0, 20)
                .map((e, idx) => `| ${idx + 1} | ${e.programme_name} | ${e.channel_name} | ${e.market_rate.toFixed(2)}% |`)
                .join('\n')}\n\n*数据来源: 猫眼专业版*`
              break
            }

            case 'web': {
              ctx.response.body = `# 🌐 今日实时网播热度排行\n\n*更新时间: ${dayjs().format('M/D HH:mm')}*\n\n| 排名 | 剧集名称 | 当前热度 | 上映信息 |\n|------|----------|----------|----------|\n${data.web.list
                .slice(0, 20)
                .map((e, idx) => `| ${idx + 1} | ${e.series_name} | ${e.curr_heat_desc} | ${e.release_info} |`)
                .join('\n')}\n\n*数据来源: 猫眼专业版*`
              break
            }
          }

          break
        }

        case 'json':
        default: {
          ctx.response.body = Common.buildJson(data[type] ?? {})
          break
        }
      }
    }
  }

  async fetchHTMLData() {
    const headers = {
      referer: 'https://piaofang.maoyan.com/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    }

    const html = await (await fetch('https://piaofang.maoyan.com/i/globalBox/historyRank', { headers })).text()
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
