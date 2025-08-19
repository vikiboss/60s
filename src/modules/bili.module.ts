import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBili {
  handle(): RouterMiddleware<'/bili'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `B站实时热搜\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const options = {
      headers: {
        'User-Agent': Common.chromeUA,
        Cookie:
          "buvid3=E45967F9-60E8-92DF-93FE-5D69F56755D422388infoc; b_nut=1755586622; b_lsid=5E8CDBE4_198C11DF5CC; _uuid=10108621BD-D2AD-5759-3E63-4956844D11BA22930infoc; buvid_fp=9202654fa27d3332f6898149c6247d39; enable_web_push=DISABLE; home_feed_column=5; browser_resolution=1512-232; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTU4NDU4MjMsImlhdCI6MTc1NTU4NjU2MywicGx0IjotMX0.jMtEAMHusK5hr-HoESMIGwi0lJ9GNmSbz_AnFPmGGRk; bili_ticket_expires=1855845763; buvid4=F999AEA8-F5BA-2B89-8A45-AD8F0229765924103-025081914-JRu8/Kx5QIzi+ePYi1pqog%3D%3D; sid=4yizwc5c; CURRENT_FNVAL=4048; CURRENT_QUALITY=0; rpdid=|(m)))u)lJ|0J'u~lll)YYJu",
      },
    }

    try {
      const api = 'https://api.bilibili.com/x/web-interface/wbi/search/square?limit=50'

      const { data = {} } = await (await fetch(api, options)).json()

      // deno-lint-ignore no-explicit-any
      return (data?.trending?.list as Item[]).map((item) => {
        return {
          title: item.keyword || item.show_name,
          link: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
        }
      })
    } catch {
      const api = 'https://app.bilibili.com/x/v2/search/trending/ranking?limit=50'
      const { data = {} } = await (await fetch(api, options)).json()

      // deno-lint-ignore no-explicit-any
      return ((data?.list?.filter((e: any) => e?.is_commercial === '0') || []) as Item[]).map((item) => {
        return {
          title: item.keyword || item.show_name,
          link: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
        }
      })
    }
  }
}

export const serviceBili = new ServiceBili()

interface Item {
  icon?: string
  hot_id: number
  keyword: string
  position: number
  show_name: string
  word_type: number
  is_commercial: string
}
