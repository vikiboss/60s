import { Common, dayjs, TZ_SHANGHAI } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

// 默认赛事 ID（2026年米兰冬奥会）
const DEFAULT_EVENT = {
  id: 'wmr-owg2026',
  name: '2026 米兰科尔蒂纳冬奥会',
}

interface MedalCount {
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
            return `${rank}. ${item.country} - 🥇${item.gold} 🥈${item.silver} 🥉${item.bronze} (总计: ${item.total})`
          })

          ctx.response.body = `奥运会奖牌榜 (${data.event_name})
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

**赛事**: ${data.event_name}
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
    const url = `https://www.olympics.com/${eventId}/competition/api/CHI/medals`

    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'upgrade-insecure-requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        cookie:
          'AKA_A2=A; bm_ss=ab8e18ef4e; ak_bmsc=E49533E1D34F610735229C2046C80D68~000000000000000000000000000000~YAAQRj0xF+QN7jKcAQAAO1IWQR5pxChdI+NmBKVhriLJhlEJQPSDP9AZe4j0u2eAwghBWOFuqVl8G3wVRkTfsGwwHDiqPOpNYnfTsb2m+O5s6hOvDR6eJ9x6iAaEU+2g2XRuo8GERhCdpeJon8LRMovVe6Wlj0BjXlt96XFKSdQac74kHBEM+hBD27qjrl6o8IFGKu1/WzD9hqSczHCEfvECTW4IALkzoVN99pp7YZZ9mw/CxhRCXgKOvlIeeCCxC1h2YOZxpPJoj+anP02g3/VOA42O8Y+eqkA3tpp3viOZ8mwguIG2r5Q55xvrLOZFLjh1DiORHtx5kfGUBQw+1/bSOxDcmm1FGB93gUZ2ToVB/21oLPquxeNyflhRnERxrq4eh+z/CT0lcT7BJg==; dl_anonymous_id=anonymous_user; gig_bootstrap_3_0-C5fmAFNYLmRECBReEdIiy3GrU6r29UMMqR5ej2AF3EiMrp2XiSJ-W3qWQ76Bsf=olympicid_ver4; bm_so=041DF693080495EF866505481C46D63058894BA3040DB2CEB686A9291EA6F04A~YAAQRj0xF4WzBjOcAQAA2votQQaT9CzSD1Yjg7J33g91SITSsEqHO4BBsM3Lst03m50kfbRR/kCcVem2Ncr1A3BjT+qNWyFVgo04Ult35WI5t+8/2lvm898Va56Jckfmi9fMGnJas2wqazc1WbXlam+SOu5gkEjiePT9GCzzBdBxiblU3T9ZXI8KTZVW9blCD7KrOgt1m+kKC9u9TeDXBqEExw5ZVgPrC2gMGzZRA00B0KeN2J5OlWQKtYsl43r3uBNud7JH26oD9aIU59k6hwhGWugOIddeJSqCCMuLloNDcaK8NESN3qWbc0E6zhIiqP7DwDlYlicRVWk1ngc40Spn6dfIpatCxeUJZfOGyOglVRkkSd8Wtg/M/pJb2Us2MV6Zk8JzxipzWPc2Q5JWJSoeV9/+SoMjLtV+F/2u0WJnjIHrwAsSyXvEdinsJZUWjvXOzORmEfb2bkugwrql; OptanonConsent=groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0%2CC0005%3A0; bm_lso=041DF693080495EF866505481C46D63058894BA3040DB2CEB686A9291EA6F04A~YAAQRj0xF4WzBjOcAQAA2votQQaT9CzSD1Yjg7J33g91SITSsEqHO4BBsM3Lst03m50kfbRR/kCcVem2Ncr1A3BjT+qNWyFVgo04Ult35WI5t+8/2lvm898Va56Jckfmi9fMGnJas2wqazc1WbXlam+SOu5gkEjiePT9GCzzBdBxiblU3T9ZXI8KTZVW9blCD7KrOgt1m+kKC9u9TeDXBqEExw5ZVgPrC2gMGzZRA00B0KeN2J5OlWQKtYsl43r3uBNud7JH26oD9aIU59k6hwhGWugOIddeJSqCCMuLloNDcaK8NESN3qWbc0E6zhIiqP7DwDlYlicRVWk1ngc40Spn6dfIpatCxeUJZfOGyOglVRkkSd8Wtg/M/pJb2Us2MV6Zk8JzxipzWPc2Q5JWJSoeV9/+SoMjLtV+F/2u0WJnjIHrwAsSyXvEdinsJZUWjvXOzORmEfb2bkugwrql~1770620092043; OptanonAlertBoxClosed=Mon, 09 Feb 2026 06:54:52 GMT; bm_s=YAAQRj0xFzJvBzOcAQAABZguQQTrZH+gV1YsHEi2JKQbLNy+ciVIdNRO57XZ2gtHAsXONYc3WxiHbOlX/hScy58D5F2p455Ginp7WQhn6F++8Fk/7SEF9LPqwTsTrwW0G5KV2RMJswPxg5PGhL+D9RZGNPFcGGxjMRTETPLZe4K67YnroqlmM4ASBhGcoXBZsDkqoMlJjhXR78/6uqGlh+jhIJb/L7TY02bd9yv9q82PVcXRwUQy66O/idb36n2fTJdgPqj2+psxRW7Ivea33ahCTP9kIi8yaHAnLs6YNVcvI9m2UfyjDACxt9rjmJzM+PxF0/ScrLhMLC9t6F+AYZpanKkInysNyP1N24FLRnOmUmVKOZ4Cbuar5CyOWWQbXMRjV8x3SZmr24CHSMqyvJjPGt17nDguY7zEj//0PEUZsnt/xwwoelh+TEC64yqSKBo5lNpq5tRvt/IXxn/jgPhliPY4ifMsBVzYzE9zRu9cO7jdiTkAXYhCDnWx7uPBtRR6W9RpVE16ZQAt2SQcQcP680qKKsxy0yD752f3uPYdvSkeWMhLzAmBG3bpHNRW6EAwyiWiVQ==',
      },
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
        const medals = entry.medalsNumber[0] || {
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
