import { responseWithBaseRes, transferText } from '../utils.ts'

const timeZoneOffset = 8
const oneHourMs = 60 * 60 * 1000
const cache: Map<number, string[]> = new Map()

const api = 'https://www.zhihu.com/api/v4/columns/c_1261258401923026944/items?limit=1'

export async function fetch60s(isText = false) {
  const today = Math.trunc((Date.now() + timeZoneOffset * oneHourMs) / (24 * oneHourMs))

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api)).json()
    const contents = data[0]?.content.match(/<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g) ?? []

    const result = contents.map((e: string) => {
      return transferText(e.replace(/<[^<>]+>/g, '').trim(), 'a2u')
    })

    result.splice(1, 1)
    cache.set(today, result)
  }

  if (isText) {
    return cache.get(today)!.join('\n')
  } else {
    return responseWithBaseRes(cache.get(today))
  }
}
