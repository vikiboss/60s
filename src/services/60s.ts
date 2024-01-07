import { responseWithBaseRes, transferText } from '../utils.ts'

const timeZoneOffset = 8
const oneHourMs = 60 * 60 * 1000
const cache: Map<number, string[]> = new Map()

const api = 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=1'

const reg = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g
const tagReg = /<[^<>]+>/g

export async function fetch60s(type = 'json') {
  const today = Math.trunc((Date.now() + timeZoneOffset * oneHourMs) / (24 * oneHourMs))

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api)).json()
    const contents = data[0]?.content.match(reg) ?? []
    const mapFn = (e: string) => transferText(e.replace(tagReg, '').trim(), 'a2u')
    const result = contents.map(mapFn)

    result.splice(1, 1)
    cache.set(today, result)
  }

  if (type === 'json') {
    return responseWithBaseRes(cache.get(today))
  } else {
    return cache.get(today)!.join('\n')
  }
}
