import { Common } from '../common'

import type { RouterMiddleware } from '@oak/oak'
import type { Service } from '../service'

class ServiceBing implements Service<'/bing'> {
  #API = 'https://cn.bing.com'
  #cache = new Map<
    string,
    {
      date: string
      headline: string
      title: string
      description: string
      image_url: string
      main_text: string
      copyright: string
    }
  >()

  handle(): RouterMiddleware<'/bing'> {
    return async ctx => {
      const data = await this.#fetchBing()

      if (!data) {
        ctx.response.status = 500
        ctx.response.body = 'Failed to fetch Bing daily image.'
        return
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.image_url || ''
          break
        case 'image':
          ctx.response.redirect(data.image_url || '')
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetchBing() {
    const dailyUniqueKey = new Date().toLocaleDateString()
    const cache = this.#cache.get(dailyUniqueKey)

    if (cache) {
      return cache
    }

    const rawContent = await (await fetch(this.#API)).text()
    const rawJson = /var\s*_model\s*=\s*([^;]+);/.exec(rawContent)?.[1] || '{}'
    const images = JSON.parse(rawJson)?.MediaContents ?? []

    if (images.length) {
      const { ImageContent = {} } = images[0] || {}

      const { Description, Image, Headline, Title, Copyright, QuickFact } = (ImageContent ||
        {}) as {
        Description: string
        Image: {
          Url: string
          Wallpaper: string
          Downloadable: boolean
        }
        Headline: string
        Title: string
        Copyright: string
        SocialGood: null
        MapLink: {
          Url: string
          Link: string
        }
        QuickFact: {
          MainText: string
          LinkUrl: string
          LinkText: string
        }
        TriviaUrl: string
        BackstageUrl: string
        TriviaId: string
      }

      const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')

      const data = {
        date: today,
        headline: Headline,
        title: Title,
        description: Description,
        image_url: Image?.Wallpaper ? `https://cn.bing.com${Image.Wallpaper}` : '',
        main_text: QuickFact?.MainText || '',
        copyright: Copyright,
      }

      this.#cache.set(dailyUniqueKey, data)

      return data
    }
  }
}

export const serviceBing = new ServiceBing()
