import pkg from '../package.json' with { type: 'json' }
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { COMMON_MSG, config } from './config.ts'

import type { BinaryToTextEncoding } from 'node:crypto'
import type { Request, RouterContext } from '@oak/oak'

import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import isBetween from 'dayjs/plugin/isBetween.js'

_dayjs.extend(utc)
_dayjs.extend(timezone)
_dayjs.extend(isBetween)

export const TZ_SHANGHAI = 'Asia/Shanghai'

export const dayjs = _dayjs

interface FormatOptions {
  locale?: string
  timeZone?: string
}

type Primitive = boolean | number | string | null | undefined

export class Common {
  static chromeUA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

  static buildJson(data: boolean | number | string | object | null, code = 200, message = COMMON_MSG) {
    const response = { code, message, data }

    if (config.debug) {
      return {
        ...response,
        __debug__: Common.getApiInfo(),
      }
    }

    return response
  }

  static requireArguments(name: string | string[], response: RouterContext<any, Record<string, any>>['response']) {
    response.status = 400
    const args = Array.isArray(name) ? name : [name]

    response.body = Common.buildJson(
      null,
      400,
      `参数 ${args.join(', ')} 不能为空。如为 query 参数，请进行必要的 URL 编码`,
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

  static async getParam(name: string, request: Request & { _bodyJson?: Record<string, any> }, parseBody = false) {
    const value = request.url.searchParams.get(name) ?? ''

    if (!parseBody && value) return value

    try {
      const json = request?._bodyJson

      if (!json) {
        request._bodyJson = await request.body.json()
      } else {
        return json[name] ?? ''
      }
    } catch {}

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

  static debug(...args: any[]) {
    if (config.debug) {
      console.log('[debug]', ...args)
    }
  }

  static async tryRepoUrl(options: { repo: string; path: string; branch?: string; alternatives?: string[] }) {
    const { repo, path, branch = 'main', alternatives = [] } = options

    const urls = config.overseas_first
      ? [
          `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${path}`,
          `https://cdn.jsdelivr.net/gh/${repo}/${path}`,
          ...alternatives,
          `https://cdn.jsdmirror.com/gh/${repo}/${path}`,
        ]
      : [
          `https://cdn.jsdmirror.com/gh/${repo}/${path}`,
          `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${path}`,
          `https://cdn.jsdelivr.net/gh/${repo}/${path}`,
          ...alternatives,
        ]

    for (const url of urls) {
      try {
        Common.debug(`Trying URL: ${url}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3_000)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': Common.chromeUA,
            'X-Real-IP': '157.255.219.143',
            'X-Forwarded-For': '157.255.219.143',
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          Common.debug(`Successful URL: ${url}`)
          return response
        }
      } catch {
        Common.debug(`Failed URL: ${url}`)
      }
    }

    return null
  }
}
