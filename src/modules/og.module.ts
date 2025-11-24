import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceOG {
  handle(): RouterMiddleware<'/og'> {
    return async (ctx) => {
      const url = await Common.getParam('url', ctx.request, true)

      if (!url) {
        return Common.requireArguments('url', ctx.response)
      }

      try {
        const data = await this.#fetch(url)

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = `标题: ${data.title}\n描述: ${data.description}`
            break

          case 'markdown':
            ctx.response.body = `# 🔗 Open Graph 信息\n\n## [${data.title || '无标题'}](${url})\n\n${data.description ? `> ${data.description}\n\n` : ''}${data.image ? `![预览图](${data.image})` : '*无预览图*'}`
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

    const title = this.decodeHtmlEntities(titleMatch?.groups?.title || '')
    const image = this.decodeHtmlEntities(imageMatch?.groups?.image || '')
    const description = this.decodeHtmlEntities(descriptionMatch?.groups?.description || '')

    return {
      title,
      image,
      description,
    }
  }

  decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&cent;': '¢',
      '&pound;': '£',
      '&yen;': '¥',
      '&euro;': '€',
      '&copy;': '©',
      '&reg;': '®',
      '&sol;': '/',
      '&quest;': '?',
      '&equals;': '=',
      '&num;': '#',
      '&percnt;': '%',
      '&plus;': '+',
      '&colon;': ':',
      '&semi;': ';',
    }

    return text.replace(/&[a-z0-9]+;|&#[0-9]+;|&#x[0-9a-f]+;/gi, (match) => {
      // Named entities
      if (entities[match.toLowerCase()]) {
        return entities[match.toLowerCase()]
      }

      // Decimal numeric entities (&#123;)
      if (match.startsWith('&#') && !match.startsWith('&#x')) {
        const code = parseInt(match.slice(2, -1), 10)
        return isNaN(code) ? match : String.fromCharCode(code)
      }

      // Hexadecimal numeric entities (&#x7B;)
      if (match.startsWith('&#x')) {
        const code = parseInt(match.slice(3, -1), 16)
        return isNaN(code) ? match : String.fromCharCode(code)
      }

      return match
    })
  }
}

export const serviceOG = new ServiceOG()
