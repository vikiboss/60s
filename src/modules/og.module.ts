import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceOG {
  handle(): RouterMiddleware<'/og'> {
    return async (ctx) => {
      const url = await Common.getParam('url', ctx.request)

      if (!url) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, 'query 参数 `url` 不能为空')
      }

      try {
        const data = await this.#fetch(url)

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = `标题: ${data.title}\n描述: ${data.description}`
            break

          case 'json':
          default:
            ctx.response.body = Common.buildJson(data)
            break
        }
      } catch (e: any) {
        console.error(e)
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 500, `OG 信息解析失败: ${e.message || e}`)
      }
    }
  }

  async #fetch(url: string) {
    const link = !/^https?:\/\//i.test(url) ? `https://${url}` : url
    let _url: URL

    try {
      _url = new URL(link)
    } catch {
      throw new Error('无效的 URL')
    }

    const response = await fetch(_url)
    const type = response.headers.get('content-type') || ''
    const isHTML = ['text/html', 'application/xhtml+xml'].some((e) => type.includes(e))

    if (!isHTML) {
      throw new Error('目标 URL 不是一个 HTML 页面，无法解析 OG 信息')
    }

    const html = await response.text()

    const ogTitlePattern = /<meta property="og:title" content="(?<title>[^"]+)"\s*\/?>/i
    const ogImagePattern = /<meta property="og:image" content="(?<image>[^"]+)"\s*\/?>/i
    const ogDescriptionPattern = /<meta property="og:description" content="(?<description>[^"]+)"\s*\/?>/i

    const [titleMatch, imageMatch, descriptionMatch] = [
      ogTitlePattern.exec(html),
      ogImagePattern.exec(html),
      ogDescriptionPattern.exec(html),
    ]

    const title = titleMatch?.groups?.title || ''
    const image = imageMatch?.groups?.image || ''
    const description = descriptionMatch?.groups?.description || ''

    return {
      title,
      image,
      description,
    }
  }
}

export const serviceOG = new ServiceOG()
