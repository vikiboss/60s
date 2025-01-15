import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { COMMON_MSG } from './config/index.ts'

import type { BinaryToTextEncoding } from 'node:crypto'
import type { Request } from '@oak/oak'

interface FormatOptions {
  locale?: string
  timeZone?: string
}

type Primitive = boolean | number | string | null | undefined

export class Common {
  static buildJson(data: boolean | number | string | object | null, code = 200, message = COMMON_MSG) {
    return {
      code,
      message,
      data,
    }
  }

  static localeDate(ts: number | string | Date = Date.now(), options: FormatOptions = {}) {
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

  static localeTime(ts: number | string | Date = Date.now(), options: FormatOptions & { seconds?: boolean } = {}) {
    const { locale = 'zh-CN', timeZone = 'Asia/Shanghai', seconds = true } = options
    const now = ts instanceof Date ? ts : new Date(ts)

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      second: seconds ? '2-digit' : undefined,
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

  static randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  static async getParam(name: string, request: Request) {
    let value = request.url.searchParams.get(name) || ''
    try {
      if (!value) {
        value = (await request.body.json())[name] || ''
      }
    } catch {
      // ignored
    }
    return value
  }

  static transformEntities(str: string, mode: 'unicode2ascii' | 'ascii2unicode' = 'ascii2unicode') {
    if (mode === 'ascii2unicode') {
      return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
    }

    return str.replace(/./, (_) => `&#${_.charCodeAt(0)};`)
  }

  static md5(text: string, encoding: 'buffer'): Buffer
  static md5(text: string, encoding?: BinaryToTextEncoding): string
  static md5(text: string, encoding: 'buffer' | BinaryToTextEncoding = 'hex'): string | Buffer {
    if (encoding === 'buffer') {
      return crypto.createHash('md5').update(text).digest()
    }
    return crypto.createHash('md5').update(text).digest(encoding)
  }

  static isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined
  }

  static qs(
    params: Record<string, Primitive | Primitive[]> | string | URLSearchParams,
    options: {
      /** 是否移除值为 null 或 undefined 的键 */
      removeNullish?: boolean
    } = {},
  ): string {
    const { removeNullish = true } = options
    const entries = Object.entries(params)
    const hasArray = entries.some(([, value]) => Array.isArray(value))

    if (hasArray) {
      const result = new URLSearchParams()
      for (const [key, value] of entries) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (removeNullish && this.isNullish(item)) continue
            result.append(key, item)
          }
        } else {
          if (removeNullish && this.isNullish(value)) continue
          result.append(key, value)
        }
      }
      return result.toString()
    }

    return new URLSearchParams(entries).toString()
  }
}
