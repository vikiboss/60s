import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceToutiao {
  #API = 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc'

  handle(): RouterMiddleware<'/toutiao'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, idx) => `${idx + 1}. ${e.title} (${e.hot_value})`)
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
    const { data = [] } = await (await fetch(this.#API)).json()

    return (data as Item[]).map(e => ({
      id: e.ClusterId,
      title: e.Title,
      hot_value: e.HotValue,
      cover: e.Image.url,
      label: e.Label,
      label_desc: e.LabelDesc,
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
