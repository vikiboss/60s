import { wrapperBaseRes, transferText } from '../utils.ts'

import type { Context } from 'oak'

interface Item {
  result: string[]
  title_image: string
  updated: number
  url: string
}

const cache: Map<string, Item> = new Map()

const api = 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=2'

const reg = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g
const tagReg = /<[^<>]+>/g

const ZHIHU_CK = Deno.env.get('ZHIHU_CK') ?? ''

function getLocaleTodayString(locale = 'zh-CN', timeZone = 'Asia/Shanghai') {
  const today = new Date()

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timeZone,
  })

  return formatter.format(today)
}

export async function fetch60s(type: string, ctx: Context) {
  const isV2 = !!ctx.request.url.searchParams.get('v2')
  const today = getLocaleTodayString()

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api, { headers: { cookie: ZHIHU_CK } })).json()
    const { content = '', url = '', title_image = '', updated = 0 } = data[0]
    const contents: string[] = content.match(reg) ?? []
    const mapFn = (e: string) => transferText(e.replace(tagReg, '').trim(), 'a2u')
    const result = contents.map(mapFn)

    if (result.length) {
      cache.set(today, { url, result, title_image, updated: updated * 1000 })
    }
  }

  const finalData = cache.get(today)
  const finalList = (finalData?.result || []).filter((e) => e.length > 3)

  if (!isV2) {
    if (type === 'json') {
      return wrapperBaseRes(finalList)
    }

    return finalList.join('\n')
  }

  const news = finalList
    .map((e) => {
      return e
        .replace(/^\d+、\s*/g, '')
        .replace(/。$/, '')
        .trim()
    })
    .filter(Boolean)

  let tip = ''

  const tipIdx = news.findIndex((e) => e.includes('微语'))

  if (tipIdx !== -1) {
    tip = news[tipIdx].replace(/【微语】/, '')
    news.splice(tipIdx, 1)
  }

  if (type === 'json') {
    return wrapperBaseRes({
      news,
      tip,
      updated: finalData?.updated ?? 0,
      url: finalData?.url ?? '',
      cover: finalData?.title_image ?? '',
    })
  }

  return news.map((e, idx) => `${idx + 1}. ${e}`).join('\n') + (tip ? `\n\n微语：${tip}` : '')
}
