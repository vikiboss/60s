import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'

class ServiceZhihuHot {
  #API = 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=1000'

  handle(): RouterMiddleware<'/zhihu-hot'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title} (${e.detail_text})`)
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
    // const headers = { cookie: globalThis.env.ZHIHU_CK || '' }
    const { data = [] } = (await (await fetch(this.#API)).json()) || {}

    return (data as Item[]).map(e => ({
      id: e.target.id,
      title: e.target.title,
      detail: e.target.excerpt,
      cover: e.children?.[0]?.thumbnail || '',
      detail_text: e.detail_text,
      answer_cnt: e.target.answer_count,
      follower_cnt: e.target.follower_count,
      comment_cnt: e.target.comment_count,
      created_at: e.target.created,
      link: e.target.url,
    }))
  }
}

export const serviceZhihuHot = new ServiceZhihuHot()

interface Item {
  type: string
  style_type: string
  id: string
  card_id: string
  target: {
    id: number
    title: string
    url: string
    type: string
    created: number
    answer_count: number
    follower_count: number
    author: {
      type: string
      user_type: string
      id: string
      url_token: string
      url: string
      name: string
      headline: string
      avatar_url: string
    }
    bound_topic_ids: number[]
    comment_count: number
    is_following: boolean
    excerpt: string
  }
  attached_info: string
  detail_text: string
  trend: number
  debut: boolean
  children: Array<{
    type: string
    thumbnail: string
  }>
  card_label?: {
    type: string
    icon: string
    night_icon: string
  }
}
