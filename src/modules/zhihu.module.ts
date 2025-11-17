import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceZhihuHot {
  handle(): RouterMiddleware<'/zhihu'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `知乎实时热搜\n\n${data
            .map((e, i) => `${i + 1}. ${e.title} (${e.hot_value_desc})`)
            .slice(0, 20)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 知乎实时热搜\n\n${data
            .slice(0, 20)
            .map(
              (e, i) =>
                `### ${i + 1}. [${e.title}](${e.link}) \`${e.hot_value_desc}\`\n\n${e.detail ? `${e.detail}\n\n` : ''}${e.cover ? `![${e.title}](${e.cover})\n\n` : ''}---\n`,
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
    const api = 'https://api.zhihu.com/topstory/hot-lists/total?limit=30'
    const response = await fetch(api)
    const { data = [] } = await response.json()

    return (data as Item[]).map((e) => ({
      title: e.target.title,
      detail: e.target.excerpt,
      cover: e.children?.[0]?.thumbnail || '',
      hot_value_desc: e.detail_text,
      answer_cnt: e.target.answer_count,
      follower_cnt: e.target.follower_count,
      comment_cnt: e.target.comment_count,
      created_at: e.target.created * 1000,
      created: Common.localeTime(e.target.created * 1000),
      link: e.target.url.replace('api.', 'www.').replace('questions', 'question'),
    }))
  }
}

export const serviceZhihu = new ServiceZhihuHot()

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
