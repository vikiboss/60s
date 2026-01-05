import { Common, dayjs } from '../common.ts'

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
        ctx.response.body = Common.buildJson(null, 500, '获取数据失败，可能是部署区域无法获取到 CN Bing 的数据')
        return
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.cover || ''
          break

        case 'markdown':
          ctx.response.body = `# ${data.title || '必应每日壁纸'}\n\n${data.headline ? `## ${data.headline}\n\n` : ''}${data.description ? `${data.description}\n\n` : ''}![${data.title}](${data.cover})\n\n${data.copyright ? `*${data.copyright}*` : ''}`
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

  getUrl(url: string) {
    const id = (new URL(url).searchParams.get('id') || '').replace(/_\d+x\d+\.jpg$/, '')
    return `https://bing.com/th?id=${id}_1920x1080.jpg`
  }

  // https://cn.bing.com//th?id=OHR.GipuzcoaSummer_ZH-CN1926924422_UHD.jpg
  // https://cn.bing.com/th?id=OHR.GipuzcoaSummer_ZH-CN1926924422_1920x1080.jpg
  get4kUrl(url: string) {
    const id = (new URL(url).searchParams.get('id') || '').replace(/_\d+x\d+\.jpg$/, '')
    return `https://bing.com/th?id=${id}_UHD.jpg`
  }

  async #fetch() {
    const dailyUniqueKey = Common.localeDate()
    const cache = this.#cache.get(dailyUniqueKey)

    if (cache) {
      return cache
    }

    const options = {
      headers: {
        'User-Agent': Common.chromeUA,
        'X-Real-IP': '157.255.219.143',
        'X-Forwarded-For': '157.255.219.143',
      },
    }

    const rawContent = await fetch('https://global.bing.com/?setmkt=zh-cn', options).then((e) => e.text())

    const rawJson = /var\s*_model\s*=\s*([^;]+);/.exec(rawContent)?.[1] || '{}'
    const images = JSON.parse(rawJson)?.MediaContents ?? []

    const now = dayjs()

    if (!images.length) {
      const api = 'https://global.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&setmkt=zh-cn'
      const { images = [] } = await fetch(api, options).then((e) => e.json())
      const image = images[0]
      if (!image) return null

      return {
        title: image.title || '',
        headline: image.title || '',
        description: image.title || '',
        main_text: image.title || '',
        cover: image?.url ? this.getUrl(`https://bing.com${image.url}`) : '',
        cover_4k: image?.url ? this.get4kUrl(`https://bing.com${image.url}`) : '',
        copyright: image.copyright || '',
        update_date: now.format('YYYY-MM-DD HH:mm:ss'),
        update_date_at: now.valueOf(),
      }
    }

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

    const data = {
      title: Title,
      headline: Headline,
      description: Description,
      main_text: QuickFact?.MainText || '',
      cover: Image?.Wallpaper ? this.getUrl(`https://bing.com${Image.Wallpaper}`) : '',
      cover_4k: Image?.Wallpaper ? this.get4kUrl(`https://bing.com${Image.Wallpaper}`) : '',
      copyright: Copyright,
      update_date: now.format('YYYY-MM-DD HH:mm:ss'),
      update_date_at: now.valueOf(),
    }

    this.#cache.set(dailyUniqueKey, data)

    return data
  }
}

export const serviceBing = new ServiceBing()
