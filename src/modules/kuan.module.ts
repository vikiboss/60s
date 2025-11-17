import dayjs from 'dayjs'
import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

interface CoolApkRawItem {
  id: number
  hash: string
  title: string
  logo: string
  cover: string
  description: string
  commentnum: number
  follownum: number
  hot_num: number
  dateline: number
  lastupdate: number
  bind_goods_id: number
  star_average_score: string
  star_total_count: number
  allow_rate: number
  open_rate: number
  is_search_show: number
  release_time: string
  url: string
  entityType: string
  entityId: number
  follownum_txt: string
  commentnum_txt: string
  hot_num_txt: string
  rating_average_score: string
  rating_total_num: number
  allow_rate_sdk?: string
  allow_rate_device?: string
  allow_rate_os?: string
  allow_publish_scope: number
}

interface CoolApkRawResponse {
  data: CoolApkRawItem[]
}

interface KuanTopicItem {
  id: number
  title: string
  description: string
  logo: string
  cover: string
  url: string
  followers: number
  comments: number
  hotness: number
  rating: {
    score: number
    total: number
  }
  created: string
  created_at: number
  updated: string
  updated_at: number
}

interface KuanApiResponse {
  topics: KuanTopicItem[]
  total: number
  updated: string
  updated_at: number
}

class ServiceKuan {
  handle(): RouterMiddleware<'/kuan'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text': {
          const items = data.topics.map((item, idx) => `${idx + 1}. ${item.title}`).join('\n')
          ctx.response.body = `酷安热门话题n\n${items}`
          break
        }

        case 'markdown': {
          ctx.response.body = `# 📱 酷安热门话题\n\n${data.topics
            .slice(0, 20)
            .map(
              (item, idx) =>
                `### ${idx + 1}. [${item.title}](${item.url})\n\n${item.description ? `${item.description}\n\n` : ''}${item.cover ? `![${item.title}](${item.cover})\n\n` : ''}📊 **热度**: ${item.hotness} | 👥 **关注**: ${item.followers} | 💬 **评论**: ${item.comments} | ⭐ **评分**: ${item.rating.score} (${item.rating.total}人)\n\n---`,
            )
            .join('\n\n')}\n\n*更新时间: ${data.updated}*`
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

  async #fetch(): Promise<KuanApiResponse> {
    const url = 'https://api.coolapk.com/v6/page/dataList?url=%23%2Ftopic%2FtagList'

    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-App-Id': 'com.coolapk.market',
      'X-App-Token': 'v3JDJ5JDEwJE5qaGpOMk0xTlRrdk1HRmpOVE13TmVLY203MlBIMG1vNWUxaWdUd2J1aXpQZ21GYWliSW5D',
      'X-App-Version': '15.5.1',
      'X-Api-Version': '15',
      'X-App-Device':
        '0UzMjlTZ1MWZyYDNlVTM3AyOzlXZr1CdzVGdgEDMw4CNxETMyIjLxE1SUByODhDRBJVO0AzMyAyOp1GZlJFI7kWbvFWaYByOgsDI7AyOhV2TqNXYVdWR3cXQ6hjZYNTWORkY5IXajZzbOl0bfpkaIVFR',
      'X-App-Supported': '2508251',
      'User-Agent': Common.chromeUA,
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const res = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, response: ${res}`)
    }

    const rawData: CoolApkRawResponse = await response.json()

    if (!rawData.data || !Array.isArray(rawData.data)) {
      throw new Error(`Invalid response format from CoolApk API: ${JSON.stringify(rawData)}`)
    }

    const transformedData: KuanApiResponse = {
      topics: rawData.data.map(this.#transformItem),
      total: rawData.data.length,
      updated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updated_at: Date.now(),
    }

    return transformedData
  }

  #transformItem(item: CoolApkRawItem): KuanTopicItem {
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      logo: item.logo,
      cover: item.cover || '',
      url: `https://www.coolapk.com${item.url}`,
      followers: item.follownum,
      comments: item.commentnum,
      hotness: item.hot_num,
      rating: {
        score: parseFloat(item.star_average_score) || 0,
        total: item.star_total_count,
      },
      created: dayjs(item.dateline * 1000).format('YYYY-MM-DD HH:mm:ss'),
      created_at: item.dateline * 1000,
      updated: dayjs(item.lastupdate * 1000).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: item.lastupdate * 1000,
    }
  }
}

export const serviceKuan = new ServiceKuan()
