import { responseWithBaseRes } from '../utils.ts'

const api = 'https://cn.bing.com'
// const api = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
const caches = new Map()

export async function fetchBing(type = 'json') {
  const dailyUniqueKey = new Date().toLocaleDateString()
  const cache = caches.get(dailyUniqueKey)

  let data

  if (cache) {
    data = cache
  } else {
    // const { images = [] } = await (await fetch(api)).json()
    const rawContent = await (await fetch(api)).text()
    const rawJson = /var _model =([^;]+);/.exec(rawContent)![1]
    const images = JSON.parse(rawJson)?.MediaContents ?? []

    if (images.length) {
      const { ImageContent } = images[0] || {}
      const { Description, Image, Headline, Title, Copyright, QuickFact } = ImageContent || {}
      const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')

      data = {
        date: today,
        headline: Headline,
        title: Title,
        description: Description,
        image_url: `https://cn.bing.com${Image?.Wallpaper}`,
        main_text: QuickFact?.MainText,
        copyright: Copyright,
      }

      caches.set(dailyUniqueKey, data)
    } else {
      data = {}
    }
  }

  if (type === 'image' || type === 'text') {
    return data.image_url
  } else {
    return responseWithBaseRes(data)
  }
}
