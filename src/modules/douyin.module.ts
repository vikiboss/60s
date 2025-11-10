import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceDouyin {
  handle(): RouterMiddleware<'/douyin'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `抖音实时热搜\n\n${data
            .map((e, idx) => `${idx + 1}. ${e.title}`)
            .slice(0, 20)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 抖音实时热搜\n\n${data
            .slice(0, 20)
            .map(
              (e, idx) =>
                `### ${idx + 1}. [${e.title}](${e.link}) \`热度: ${e.hot_value}\`\n\n${e.cover ? `![${e.title}](${e.cover})\n\n` : ''}---\n`,
            )
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
    const api = 'https://aweme-lq.snssdk.com/aweme/v1/hot/search/list/?aid=1128&version_code=880'
    const { data = {} } = await (await fetch(api)).json()
    const { word_list = [], active_time = '' } = data
    const list = word_list as {
      article_detail_count: number
      aweme_infos: null
      can_extend_detail: boolean
      discuss_video_count: number
      display_style: number
      drift_info: null
      event_time: number
      group_id: string
      hot_value: number
      hotlist_param: string
      label: number
      position: number
      related_words: null
      sentence_id: string
      sentence_tag: number
      video_count: number
      word: string
      word_cover: {
        uri: string
        url_list: string[]
      }
      word_sub_board: null | number[]
      word_type: number
      room_count?: number
    }[]

    return list.map((e) => ({
      title: e?.word,
      hot_value: e?.hot_value,
      cover: e?.word_cover?.url_list[0],
      link: e?.word ? `https://www.douyin.com/search/${encodeURIComponent(e.word)}` : '',
      event_time: Common.localeTime(e?.event_time * 1000),
      event_time_at: new Date(e?.event_time).getTime(),
      active_time,
      active_time_at: new Date(active_time).getTime(),
    }))
  }
}

export const serviceDouyin = new ServiceDouyin()
