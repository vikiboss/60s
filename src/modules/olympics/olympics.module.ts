// from https://www.olympics.com/zh/api/v1/b2p/menu/topbar/olympic-games
import events from './events.json' with { type: 'json' }

import { Common, dayjs, TZ_SHANGHAI } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

// 默认赛事 ID（2026
const ONGOING_EVENT_CODE = 'wmr-owg2026'
const ONGOING_EVENT = {
  event_id: 'milano-cortina-2026',
  event_name: '2026年米兰科尔蒂纳冬奥会',
  start_date: '2026-02-06',
  end_date: '2026-02-22',
}

export class OlympicsService {
  handle(): RouterMiddleware<'/olympics'> {
    return async (ctx) => {
      // 获取赛事 ID 参数，默认使用当前赛事
      const eventId = ctx.request.url.searchParams.get('id')
      const isOngoing = !eventId || eventId === ONGOING_EVENT.event_id
      const data = isOngoing ? await this.#fetchOngoing(ONGOING_EVENT_CODE) : await this.#fetchHistoryEvent(eventId)

      const encoding = ctx.state.encoding as string | undefined

      switch (encoding) {
        case 'text': {
          const lines = data.list.map((item, index) => {
            const rank = index + 1
            return `${rank}. ${item.country} 🥇${item.gold} 🥈${item.silver} 🥉${item.bronze} 共 ${item.total}`
          })

          ctx.response.body = `${data.event_name}
更新时间: ${data.updated}

${lines.join('\n')}`
          break
        }

        case 'markdown': {
          const rows = data.list.map((item, index) => {
            const rank = index + 1
            return `| ${rank} | ${item.country} | ${item.gold} | ${item.silver} | ${item.bronze} | ${item.total} |`
          })

          ctx.response.body = `# 奥运会奖牌榜

**奥运赛事**: ${data.event_name}
**更新时间**: ${data.updated}

| 排名 | 国家/地区 | 🥇 金牌 | 🥈 银牌 | 🥉 铜牌 | 总计 |
|------|----------|---------|---------|---------|------|
${rows.join('\n')}`
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

  handleEventList(): RouterMiddleware<'/olympics/events'> {
    return async (ctx) => {
      ctx.response.body = Common.buildJson(
        events
          .filter((e) => ['Winter', 'Summer'].includes(e.season))
          .map((e) => ({
            id: e.slug,
            year: e.year,
            name: e.title,
            season: e.season === 'Winter' ? '冬季' : '夏季',
            logo: e.imageurl,
            url: e.url,
          })),
      )
    }
  }

  async #fetchOngoing(code: string): Promise<OlympicsMedalsResponse> {
    const url = `https://proxy.viki.moe/${code}/competition/api/CHI/medals?proxy-host=www.olympics.com`

    const response = await fetch(url, {
      headers: {
        referer: 'https://www.olympics.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
    })

    if (!response.ok) {
      throw new Error(`获取奖牌榜数据失败: ${response.status} ${response.statusText}`)
    }

    const apiData: ApiResponse = await response.json()

    if (!apiData.medalStandings?.medalsTable) {
      throw new Error('奖牌榜数据格式错误')
    }

    // 处理并排序奖牌数据
    const list: CountryMedal[] = apiData.medalStandings.medalsTable
      .map((entry) => {
        const medals = entry.medalsNumber.find((m) => m.type === 'Total') || { gold: 0, silver: 0, bronze: 0, total: 0 }

        return {
          rank: 0, // 稍后计算
          code: entry.organisation,
          country: entry.description,
          gold: medals.gold,
          silver: medals.silver,
          bronze: medals.bronze,
          total: medals.total,
          flag: `https://gstatic.olympics.com/s3/noc/oly/3x2/${entry.organisation}.png`,
        }
      })
      .toSorted((a, b) => {
        if (a.gold !== b.gold) return b.gold - a.gold
        if (a.silver !== b.silver) return b.silver - a.silver
        if (a.bronze !== b.bronze) return b.bronze - a.bronze
        return a.country.localeCompare(b.country, 'zh-CN')
      })
      .map((item, index) => ({ ...item, rank: index + 1 }))

    const now = dayjs().tz(TZ_SHANGHAI)

    return {
      ...ONGOING_EVENT,
      updated: now.format('YYYY-MM-DD HH:mm:ss'),
      updated_at: now.valueOf(),
      list,
    }
  }

  async #fetchHistoryEvent(id: string): Promise<OlympicsMedalsResponse> {
    const re = await fetch('https://bff-api.olympics.com/bff/api/session/exchange', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'User-Agent': Common.chromeUA,
        Referer: 'https://www.olympics.com/',
      },
      body: JSON.stringify({ tid: 'sed' }),
      redirect: 'manual',
    })

    // __sdw-bff cookie
    const cookie = re.headers
      .getSetCookie()
      .map((c) => (c.startsWith('__sdw-bff=') ? c.split(';')[0] : null))
      .filter(Boolean)
      .join('; ')
      .replace('__sdw-bff=;', '')

    const headers = {
      'User-Agent': Common.chromeUA,
      Referer: `https://www.olympics.com/zh/olympic-games/${id}/medals`,
      cookie,
    }

    const response = await fetch(`https://bff-api.olympics.com/bff/api/usdm/v1/competitions/${id}?languageCode=ZH`, {
      headers,
    })

    if (response.status === 204) {
      throw new Error(`暂无 ID 为 ${id} 的奥运赛事数据`)
    }

    const eventData: EventInfoApiResponse = await response.json()

    const eventId = eventData.data.id
    const eventSlug = eventData.data.slug

    const medalsResponse = await fetch(
      `https://bff-api.olympics.com/bff/api/usdm/v1/competitions/${eventId}/awards/noc?languageCode=ZH`,
      { headers },
    )

    const medalsData: BffApiResponse = await medalsResponse.json()

    // 处理奖牌数据，转换成 CountryMedal[] 格式
    const list: CountryMedal[] = medalsData.data
      .toSorted(
        (a, b) =>
          b.total - a.total ||
          b.golden - a.golden ||
          b.silver - a.silver ||
          b.bronze - a.bronze ||
          a.organisation.country.localeCompare(b.organisation.country, 'zh-CN'),
      )
      .map((item, idx) => ({
        rank: idx + 1,
        code: item.organisation.code.split('$')[1],
        country: item.organisation.name,
        gold: item.golden,
        silver: item.silver,
        bronze: item.bronze,
        total: item.total,
        flag: `https://gstatic.olympics.com/s3/noc/oly/3x2/${item.organisation.code.split('$')[1]}.png`,
      }))

    const now = dayjs().tz(TZ_SHANGHAI)

    return {
      event_id: eventSlug,
      event_name: events.find((e) => e.slug === eventSlug)?.title || eventData.data.title || '-',
      start_date: eventData.data.startDate,
      end_date: eventData.data.finishDate,
      updated: now.format('YYYY-MM-DD HH:mm:ss'),
      updated_at: now.valueOf(),
      list,
    }
  }
}

export const olympicsService = new OlympicsService()

interface CountryMedal {
  rank: number
  code: string
  country: string
  gold: number
  silver: number
  bronze: number
  total: number
  flag: string
}

interface OlympicsMedalsResponse {
  list: CountryMedal[]
  event_id: string
  event_name: string
  start_date: string
  end_date: string
  updated: string
  updated_at: number
}

interface MedalCount {
  type: 'Men' | 'Women' | 'Total'
  gold: number
  silver: number
  bronze: number
  total: number
}

interface ApiMedalTableEntry {
  medalsNumber: MedalCount[]
  organisation: string
  description: string
  rank?: string
}

interface ApiResponse {
  medalStandings: {
    medalsTable: ApiMedalTableEntry[]
  }
}

export interface BffApiResponse {
  data: Array<{
    bronze: number
    competition: {
      categories: string[]
      finishDate: string
      id: string
      startDate: string
      title: string
    }
    golden: number
    organisation: {
      code: string
      country: string
      id: string
      name: string
      type: string
    }
    silver: number
    total: number
  }>
  this: string
  links: Array<{
    href: string
    method: string
    rel: string
  }>
}

export interface EventInfoApiResponse {
  data: {
    categories: string[]
    closingVenue: {
      id: string
      region: string
      title: string
    }
    country: string
    disciplines: Array<{
      competitionId: string
      externalIds: string[]
      id: string
      sportDisciplineId: string
      title: string
      slug: string
    }>
    externalIds: string[]
    finishDate: string
    information: string
    logo: string
    openingVenue: {
      id: string
      region: string
      title: string
    }
    region: string
    slug: string
    sources: string[]
    startDate: string
    title: string
    id: string
  }
  this: string
  links: Array<{
    href: string
    method: string
    rel: string
  }>
}
