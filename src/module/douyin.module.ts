import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'

class ServiceDouyin {
  #API = 'https://aweme-lq.snssdk.com/aweme/v1/hot/search/list/?aid=1128&version_code=880'

  handle(): RouterMiddleware<'/douyin'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, idx) => `${idx + 1}. ${e.word}`)
            .join('\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const { data = {} } = await (await fetch(this.#API)).json()
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

    return list.map(e => ({
      word: e?.word,
      url: e?.word_cover?.uri,
      cover: e?.word_cover?.url_list[0],
      event_time: e?.event_time,
      hot_value: e?.hot_value,
      label: e?.label,
      position: e?.position,
      word_type: e?.word_type,
      active_time,
    }))
  }
}

export const serviceDouyin = new ServiceDouyin()
