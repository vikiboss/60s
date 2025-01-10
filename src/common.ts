import { COMMON_MSG } from './config'

interface FormatOptions {
  locale?: string
  timeZone?: string
}

export class Common {
  static buildJson(
    data: boolean | number | string | object | null,
    code = 200,
    message = COMMON_MSG
  ) {
    return {
      code,
      message,
      data,
    }
  }

  static localeDate(ts: number | Date = Date.now(), options: FormatOptions = {}) {
    const { locale = 'zh-CN', timeZone = 'Asia/Shanghai' } = options
    const today = ts instanceof Date ? ts : new Date(ts)

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    })

    return formatter.format(today)
  }

  static localeTime(
    ts: number | Date = Date.now(),
    options: FormatOptions & { seconds?: boolean } = {}
  ) {
    const { locale = 'zh-CN', timeZone = 'Asia/Shanghai', seconds = true } = options
    const now = ts instanceof Date ? ts : new Date(ts)

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...(seconds ? { second: '2-digit' } : {}),
      timeZone,
    })

    return formatter.format(now)
  }

  static useProxiedUrl(link: string) {
    if (!globalThis.env.DEV) return link
    const url = new URL(link)
    url.searchParams.set('proxy-host', url.host)
    url.host = 'proxy.viki.moe'
    return url.toString()
  }
}
