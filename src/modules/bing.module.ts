import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

interface BingItem {
  title: string
  headline: string
  description: string
  cover: string
  main_text: string
  copyright: string
  update_date: string
}

class ServiceBing {
  #cache = new Map<string, BingItem>()

  handle(): RouterMiddleware<'/bing'> {
    return async (ctx) => {
      const data = await this.#fetch()

      if (!data) {
        ctx.response.status = 500
        ctx.response.body = Common.buildJson(null, 500, '获取数据失败')
        return
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.cover || ''
          break

        case 'image':
          ctx.response.redirect(data.cover || '')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const dailyUniqueKey = Common.localeDate()
    const cache = this.#cache.get(dailyUniqueKey)

    if (cache) {
      return cache
    }

    const api = 'https://cn.bing.com/'
    // https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10

    const rawContent = await (await fetch(api, { headers: { 'User-Agent': Common.chromeUA } })).text()
    const rawJson = /var\s*_model\s*=\s*([^;]+);/.exec(rawContent)?.[1] || '{}'
    const images = JSON.parse(rawJson)?.MediaContents ?? []

    if (images.length) {
      const { ImageContent = {} } = images[0] || {}

      const { Description, Image, Headline, Title, Copyright, QuickFact } = (ImageContent || {}) as {
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

      const today = Common.localeDate()

      const data = {
        title: Title,
        headline: Headline,
        description: Description,
        main_text: QuickFact?.MainText || '',
        cover: Image?.Wallpaper ? `https://cn.bing.com${Image.Wallpaper.replaceAll('1920x1200', '1920x1080')}` : '',
        copyright: Copyright,
        update_date: today,
        update_date_at: Date.now(),
      }

      this.#cache.set(today, data)

      return data
    }
  }
}

export const serviceBing = new ServiceBing()
