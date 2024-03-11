import { Context } from 'https://deno.land/x/oak@v12.1.0/mod.ts'
import { responseWithBaseRes, transferText } from '../utils.ts'

interface Item {
  result: string[]
  title_image: string
  updated: number
  url: string
}

const cache: Map<number, Item> = new Map()

const timeZoneOffset = 8
const oneHourMs = 60 * 60 * 1000

const api = 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=2'

const reg = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g
const tagReg = /<[^<>]+>/g

export async function fetch60s(type = 'json', ctx: Context) {
  const isV2 = !!ctx.request.url.searchParams.get('v2')
  const today = Math.trunc((Date.now() + timeZoneOffset * oneHourMs) / (24 * oneHourMs))

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api)).json()
    const { content = '', url = '', title_image = '', updated = 0 } = data[0]
    const contents: string[] = content.match(reg) ?? []
    const mapFn = (e: string) => transferText(e.replace(tagReg, '').trim(), 'a2u')
    const result = contents.map(mapFn)

    if (result.length) {
      cache.set(today, { url, result, title_image, updated: updated * 1000 })
    }
  }

  const finalData = cache.get(today)

  if (!isV2) {
    if (type === 'json') {
      return responseWithBaseRes(finalData?.result || [])
    } else {
      return finalData?.result.join('\n')
    }
  } else {
    const news = (finalData?.result || []).map(e => {
      return e
        .replace(/^\d+、\s*/g, '')
        .replace(/。$/, '')
        .trim()
    })

    const tip = news.pop()?.replace(/【微语】/, '') || ''

    if (type === 'json') {
      return responseWithBaseRes({
        news,
        tip,
        updated: finalData?.updated ?? 0,
        url: finalData?.url ?? '',
        cover: finalData?.title_image ?? ''
      })
    } else {
      return [...news, tip].join('\n')
    }
  }
}
