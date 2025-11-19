import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

const xhsApiUrl = 'https://edith.xiaohongshu.com/api/sns/v1/search/hot_list'

const xhsHeaders = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.7(0x18000733) NetType/WIFI Language/zh_CN',
  referer: 'https://app.xhs.cn/',
  'xy-direction': '22',
  shield:
    'XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434Oe+FTRagxxoaz6rUWSZ3+juJYz8RZqct+oNMyZQxLEBaBEL+H3i0RhOBVGrauzVSARchIWFYwbwkV',
  'xy-platform-info':
    'platform=iOS&version=8.7&build=8070515&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&bundle=com.xingin.discover',
  'xy-common-params':
    'app_id=ECFAAF02&build=8070515&channel=AppStore&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&device_fingerprint=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_fingerprint1=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_model=phone&fid=1695182528-0-0-63b29d709954a1bb8c8733eb2fb58f29&gid=7dc4f3d168c355f1a886c54a898c6ef21fe7b9a847359afc77fc24ad&identifier_flag=0&lang=zh-Hans&launch_id=716882697&platform=iOS&project_id=ECFAAF&sid=session.1695189743787849952190&t=1695190591&teenager=0&tz=Asia/Shanghai&uis=light&version=8.7',
}

class ServiceRednote {
  handle(): RouterMiddleware<'/rednote'> {
    return async (ctx) => {
      const response = await fetch(xhsApiUrl, {
        method: 'GET',
        headers: xhsHeaders,
      })

      const apiData = (await response.json()) as RednoteRawResponse

      const hotList: RednoteItem[] = apiData.data.items.map((item, idx) => {
        return {
          rank: idx + 1,
          title: item.title,
          score: item.score,
          word_type: item.word_type,
          work_type_icon: item.icon || '',
          link: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}&type=51`,
          // type: item.type,
        }
      })

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = `小红书实时热点\n\n${hotList
            .slice(0, 20)
            .map((e) => `${e.rank}. ${e.title} (${e.score})`)
            .join('\n')}`
          break
        }

        case 'markdown': {
          ctx.response.body = `# 小红书实时热点\n\n${hotList
            .slice(0, 20)
            .map((e) => `${e.rank}. [${e.title}](${e}) \`${e.score}\``)
            .join('\n')}`
          break
        }

        case 'json':
        default:
          ctx.response.body = Common.buildJson(hotList)
          break
      }
    }
  }
}

export const serviceRednote = new ServiceRednote()

interface RednoteItem {
  title: string
  word_type: string
  score: string
  rank: number
  link: string
  // type: string
}

interface RednoteRawResponse {
  success: boolean
  msg: string
  data: {
    items: {
      word_type: string
      score: string
      rank_change: number
      title_img: string
      title: string
      id: string
      icon?: string
      type: string
    }[]
    is_new_hot_list_exp: boolean
    host: string
    background_color: object
    scene: string
    result: { success: boolean }
    word_request_id: string
    hot_list_id: string
    title: string
  }
  code: number
}
