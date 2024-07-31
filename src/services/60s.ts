import { wrapperBaseRes, transferText } from '../utils.ts'

import type { Context } from 'oak'

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

const zseCk = Deno.env.get('ZSE_CK') ?? ''

export async function fetch60s(type: string, ctx: Context) {
  const isV2 = !!ctx.request.url.searchParams.get('v2')
  const today = Math.trunc((Date.now() + timeZoneOffset * oneHourMs) / (24 * oneHourMs))

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api, { headers: { cookie: `__zse_ck=${zseCk};` } })).json()
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
      return wrapperBaseRes(finalData?.result || [])
    }

    return finalData?.result.join('\n')
  }

  const news = (finalData?.result || []).map((e) => {
    return e
      .replace(/^\d+、\s*/g, '')
      .replace(/。$/, '')
      .trim()
  })

  const tip = news.pop()?.replace(/【微语】/, '') || ''

  if (type === 'json') {
    return wrapperBaseRes({
      news,
      tip,
      updated: finalData?.updated ?? 0,
      url: finalData?.url ?? '',
      cover: finalData?.title_image ?? '',
    })
  }

  return [...news, tip].join('\n')
}
