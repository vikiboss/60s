import { Common, dayjs, TZ_SHANGHAI } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

// 默认赛事 ID（2026年米兰冬奥会）
const DEFAULT_EVENT = {
  id: 'wmr-owg2026',
  name: '2026 米兰科尔蒂纳冬奥会',
}

interface MedalCount {
  type: 'Men' | 'Women' | 'Total'
  gold: number
  silver: number
  bronze: number
  total: number
}

interface CountryMedal {
  rank: number
  code: string
  country: string
  gold: number
  silver: number
  bronze: number
  total: number
}

interface OlympicsMedalsResponse {
  list: CountryMedal[]
  event_id: string
  event_name: string
  updated: string
  updated_at: number
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
    lastUpdatedDateTimeUtc: string
  }
}

export class OlympicsService {
  handle(): RouterMiddleware<'/olympics'> {
    return async (ctx) => {
      // 获取赛事 ID 参数，默认使用当前赛事
      const eventId = ctx.request.url.searchParams.get('id') || DEFAULT_EVENT.id
      const data = await this.#fetch(eventId)
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

  async #fetch(eventId: string): Promise<OlympicsMedalsResponse> {
    const url = `https://proxy.viki.moe/${eventId}/competition/api/CHI/medals?proxy-host=www.olympics.com`

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

    // 转换时间
    const updatedTime = dayjs(apiData.medalStandings.lastUpdatedDateTimeUtc).tz(TZ_SHANGHAI)

    // 处理并排序奖牌数据
    const list: CountryMedal[] = apiData.medalStandings.medalsTable
      .map((entry) => {
        const medals = entry.medalsNumber.find((m) => m.type === 'Total') || {
          gold: 0,
          silver: 0,
          bronze: 0,
          total: 0,
        }

        return {
          rank: 0, // 稍后重新计算
          code: entry.organisation,
          country: entry.description,
          gold: medals.gold,
          silver: medals.silver,
          bronze: medals.bronze,
          total: medals.total,
          flag: `https://gstatic.olympics.com/s3/noc/oly/3x2/${entry.organisation}.png`,
        }
      })
      // 排序：先按金牌、再按银牌、再按铜牌、最后按国家名称
      .toSorted((a, b) => {
        if (a.gold !== b.gold) return b.gold - a.gold
        if (a.silver !== b.silver) return b.silver - a.silver
        if (a.bronze !== b.bronze) return b.bronze - a.bronze
        return a.country.localeCompare(b.country, 'zh-CN')
      })
      // 重新分配排名
      .map((item, index) => ({ ...item, rank: index + 1 }))

    return {
      event_id: eventId,
      event_name: DEFAULT_EVENT.id === eventId ? DEFAULT_EVENT.name : eventId,
      updated: updatedTime.format('YYYY-MM-DD HH:mm:ss'),
      updated_at: updatedTime.valueOf(),
      list,
    }
  }
}

export const olympicsService = new OlympicsService()
