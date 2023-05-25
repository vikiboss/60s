import { responseWithBaseRes } from '../utils.ts'

const api = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
const caches = new Map()

export async function fetchBing(type = 'json') {
  const dailyUniqueKey = new Date().toLocaleDateString()
  const cache = caches.get(dailyUniqueKey)

  let data

  if (cache) {
    data = cache
  } else {
    const { images = [] } = await (await fetch(api)).json()

    if (images.length) {
      const { urlbase, copyright, title, startdate } = images[0] || {}

      data = {
        title,
        url: `https://cn.bing.com${urlbase}_1920x1080.jpg`,
        date: startdate?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        copyright
      }

      caches.set(dailyUniqueKey, data)
    } else {
      data = {}
    }
  }

  if (type === 'image' || type === 'text') {
    return data.url
  } else {
    return responseWithBaseRes(data)
  }
}
