import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceToutiao {
  handle(): RouterMiddleware<'/toutiao'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `头条实时热搜\n\n${data
            .map((e, idx) => `${idx + 1}. ${e.title} (${e.hot_value})`)
            .slice(0, 20)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 头条实时热搜\n\n${data
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
    const api = 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc'
    const { data = [] } = await (await fetch(api)).json()

    return (data as Item[]).map((e) => ({
      title: e.Title,
      hot_value: +e.HotValue,
      cover: e.Image.url,
      link: e.Url.split('?')[0].replace(/\/$/, ''),
    }))
  }
}

export const serviceToutiao = new ServiceToutiao()

interface Item {
  ClusterId: number
  Title: string
  LabelUrl: string
  Label: string
  Url: string
  HotValue: string
  Schema: string
  LabelUri: {
    uri: string
    url: string
    width: number
    height: number
    url_list: { url: string }[] | null
    image_type: number
  }
  ClusterIdStr: string
  ClusterType: number
  QueryWord: string
  InterestCategory?: string[]
  Image: {
    uri: string
    url: string
    width: number
    height: number
    url_list: { url: string }[]
    image_type: number
  }
  LabelDesc?: string
}
