import { serve } from 'https://deno.land/std@0.180.0/http/server.ts'

const timeZoneOffset = 8
const oneHourMs = 60 * 60 * 1000
const cache: Map<number, string[]> = new Map()
const defaultTips = '数据来自 zhihu, 接口开源地址: https://github.com/vikiboss/60s'
const api = 'https://www.zhihu.com/api/v4/columns/c_1261258401923026944/items?limit=1'

function responseWithBaseRes(obj: any, status = 200, message = defaultTips): Response {
  const headers = {
    'Content-Type': 'application/json; charset=utf8'
  }

  const body = JSON.stringify({
    status,
    message,
    data: obj || {}
  })

  return new Response(body, { headers })
}

function transfer(str: string, mode: 'u2a' | 'a2u') {
  if (mode === 'a2u') {
    return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
  } else {
    return str.replace(/./, _ => `&#${_.charCodeAt(0)};`)
  }
}

async function handler(req: Request) {
  const url = new URL(req.url)
  const isText = url.searchParams.get('encoding') === 'text'

  const today = Math.trunc((Date.now() + timeZoneOffset * oneHourMs) / (24 * oneHourMs))

  if (!cache.get(today)) {
    const { data = [] } = await (await fetch(api)).json()

    const contents = data[0]?.content.match(/<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g) ?? []

    const result = contents.map((e: string) => {
      return transfer(e.replace(/<[^<>]+>/g, '').trim(), 'a2u')
    })

    result.splice(1, 1)

    cache.set(today, result)
  }

  if (isText) {
    return new Response(cache.get(today)!.join('\n'))
  } else {
    return responseWithBaseRes(cache.get(today))
  }
}

serve(handler)
