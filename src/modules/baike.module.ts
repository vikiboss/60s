import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceBaike {
  handle(): RouterMiddleware<'/baike'> {
    return async (ctx) => {
      const word = ctx.request.url.searchParams.get('word')

      if (!word) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '缺少 query 参数 word')
        return
      }

      try {
        const data = await this.#fetch(ctx.request.url.searchParams.get('word') ?? '')

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = `${data.title}: ${data.abstract} (详情: ${data.link})`
            break

          case 'json':
          default:
            ctx.response.body = Common.buildJson(data)
            break
        }
      } catch {
        ctx.response.status = 404
        ctx.response.body = Common.buildJson(null, 404, '未找到相关词条')
      }
    }
  }

  async #fetch(item: string) {
    const api = new URL('https://baike.baidu.com/api/openapi/BaikeLemmaCardApi')

    api.searchParams.set('scope', '103')
    api.searchParams.set('format', 'json')
    api.searchParams.set('appid', '379020')
    api.searchParams.set('bk_key', item)
    api.searchParams.set('bk_length', '100')

    const data = (await (await fetch(api)).json()) as BaikeData

    if (!data?.title) {
      throw new Error('未找到相关词条')
    }

    return {
      title: data.title,
      description: data.desc,
      abstract: data.abstract,
      cover: data.image,
      has_other: !!data.hasOther,
      link: data.url,
    }
  }
}

export const serviceBaike = new ServiceBaike()

interface BaikeData {
  id: number
  subLemmaId: number
  newLemmaId: number
  key: string
  desc: string
  title: string
  card: Array<{
    key: string
    name: string
    value: string[]
    format: string[]
  }>
  image: string
  src: string
  imageHeight: number
  imageWidth: number
  isSummaryPic: string
  abstract: string
  moduleIds: number[]
  url: string
  wapUrl: string
  hasOther: number
  totalUrl: string
  catalog: string[]
  wapCatalog: string[]
  logo: string
  copyrights: string
  customImg: string
  redirect: any[]
}
