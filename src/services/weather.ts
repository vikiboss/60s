import { Context } from 'oak'

const cacheMap = new Map<string, [number, object]>()
const cacheInterval = 10 * 60_1000 // 10 分钟缓存

export async function fetchWeather(city: string = 'beijing', type = 'json', ctx: Context) {
  const oriSearch = ctx.request.url.search.replace(/^\?/, '')
  const format = type === 'json' ? 'j1' : ''
  const search = `lang=zh-cn${format ? `&format=${format}` : ''}${oriSearch ? `&${oriSearch}` : ''}`

  const cacheKey = `weather-${city}-${search}`
  const cacheTime = cacheMap.get(cacheKey) || [0, {}]
  const url = `https://wttr.in/${encodeURIComponent(city)}?${search}`

  if (cacheTime[0] && Date.now() - cacheTime[0] < cacheInterval) return cacheTime[1]
  const data = await (await fetch(url))[type === 'json' ? 'json' : 'text']()
  cacheMap.set(cacheKey, [Date.now(), data])

  return data
}
