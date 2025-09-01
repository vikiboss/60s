import pkg from '../package.json' with { type: 'json' }
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { COMMON_MSG, config } from './config.ts'

import type { BinaryToTextEncoding } from 'node:crypto'
import type { Request, RouterContext } from '@oak/oak'

import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

_dayjs.extend(utc)
_dayjs.extend(timezone)

export const TZ_SHANGHAI = 'Asia/Shanghai'

export const dayjs = _dayjs

interface FormatOptions {
  locale?: string
  timeZone?: string
}

type Primitive = boolean | number | string | null | undefined

export class Common {
  static chromeUA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.69'

  static buildJson(data: boolean | number | string | object | null, code = 200, message = COMMON_MSG) {
    const res = { code, message, data }

    if (config.debug) {
      return {
        ...res,
        __debug__: Common.getApiInfo(),
      }
    }

    return res
  }

  static requireArguments(name: string | string[], ctx: RouterContext<any, Record<string, any>>) {
    ctx.response.status = 400
    const args = Array.isArray(name) ? name : [name]

    ctx.response.body = Common.buildJson(
      null,
      400,
      `参数 ${args.join(', ')} 不能为空，可以是 GET 请求的 query 参数或 POST 请求的 body JSON 参数。query 参数请进行必要的 URL 编码`,
    )
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
    // deno-lint-ignore no-process-global
    if (!process.env.DEV) return link
    const url = new URL(link)
    url.searchParams.set('proxy-host', url.host)
    url.host = 'proxy.viki.moe'
    return url.toString()
  }

  static randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
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

  static getApiInfo() {
    return {
      api_name: '60s-api',
      api_version: pkg.version,
      api_docs: 'https://docs.60s-api.viki.moe',
      author: config.author,
      user_group: config.group,
      github_repo: config.github,
      updated: pkg.updateTime,
      updated_at: new Date(pkg.updateTime).getTime(),
    }
  }
}
