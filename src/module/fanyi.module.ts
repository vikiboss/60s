import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { Common } from '../common.ts'
import { serviceHash } from './hash.module.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceFanyi {
  handle(): RouterMiddleware<'/ip'> {
    return async ctx => {
      const text = ctx.request.url.searchParams.get('text') || ''

      if (!text) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, 'text 参数不能为空')
        return
      }

      const from = ctx.request.url.searchParams.get('from') || 'auto'
      const to = ctx.request.url.searchParams.get('to') || 'auto'

      const data = await this.#fetch(text, from, to)
      const isSuccess = data.code === 0
      const responseItem = data?.translateResult?.[0]?.[0] || {}

      ctx.response.status = isSuccess ? 200 : 500
      const [sourceType, targetType] = data.type.split('2')

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = isSuccess ? data.translateResult[0][0]?.tgt || '' : '[翻译服务异常]'
          break

        case 'json':
        default:
          ctx.response.body = isSuccess
            ? Common.buildJson({
                source: {
                  type: sourceType,
                  content: responseItem?.src || '',
                  pronounce: responseItem?.srcPronounce || '',
                },
                target: {
                  type: targetType,
                  content: responseItem?.tgt || '',
                  pronounce: responseItem?.tgtPronounce || '',
                },
              })
            : Common.buildJson(null, 500, `翻译服务异常，调试信息: ${JSON.stringify(data)}`)
          break
      }
    }
  }

  async #fetch(text: string, from: string, to: string) {
    const alloc = (key: string) => ServiceFanyi.md5(key)
    const aesDecode = (value: string) => {
      const key =
        'ydsecret://query/key/B*RGygVywfNBwpmBaZg*WT7SIOUP2T0C9WHMZN39j^DAdaZhAnxvGcCY6VYFwnHl'
      const iv =
        'ydsecret://query/iv/C@lZe2YzHtZ2CYgaXKSVfsb7Y4QWHjITPPZ0nQp87fBeJ!Iv6v^6fvi2WN@bYpJ4'
      const encoder = crypto.createDecipheriv('aes-128-cbc', alloc(key), alloc(iv))
      return encoder.update(value, 'base64', 'utf-8') + encoder.final('utf-8')
    }
    const getSign = (now: string, secretKey: string) =>
      serviceHash.md5(`client=fanyideskweb&mysticTime=${now}&product=webfanyi&key=${secretKey}`)
    function getParams(secretKey: string) {
      const now = String(Date.now())
      return {
        sign: getSign(now, secretKey),
        client: 'fanyideskweb',
        product: 'webfanyi',
        appVersion: '1.0.0',
        vendor: 'web',
        pointParam: 'client,mysticTime,product',
        mysticTime: now,
        keyfrom: 'fanyi.web',
      }
    }
    async function getSecretKey() {
      const keyApi = 'https://dict.youdao.com/webtranslate/key'
      const params = { keyid: 'webfanyi-key-getter', ...getParams('asdjnjfenknafdfsdfsd') }
      const data = await (await fetch(`${keyApi}?${ServiceFanyi.qs(params)}`)).json()
      return data?.data?.secretKey || ''
    }

    const params = getParams(await getSecretKey())
    const headers = {
      cookie:
        'OUTFOX_SEARCH_USER_ID_NCOO=2100336809.6038957; OUTFOX_SEARCH_USER_ID=711138426@112.20.94.181',
      referer: 'https://fanyi.youdao.com/',
      'content-type': 'application/x-www-form-urlencoded',
    }
    const payload = { from, to, i: text, dictResult: true, keyid: 'webfanyi', ...params }
    const options = { method: 'POST', headers, body: ServiceFanyi.qs(payload) }
    const translationApi = 'https://dict.youdao.com/webtranslate'
    const data = await (await fetch(translationApi, options)).text()
    return JSON.parse(aesDecode(data)) as YoudaoData
  }

  static md5(text: string): Buffer {
    return crypto.createHash('md5').update(text).digest()
  }

  static qs(params: Record<string, any>): string {
    return new URLSearchParams(params).toString()
  }
}

export const serviceFanyi = new ServiceFanyi()

interface YoudaoData {
  code: number
  dictResult: {
    ce?: {
      word: {
        trs?: {
          voice: string
          '#text': string
          '#tran': string
        }[]
        phone?: string
        'return-phrase'?: string
      }
    }
    ec?: {
      exam_type: string[]
      word: {
        usphone?: string
        ukphone?: string
        ukspeech?: string
        trs?: {
          pos: string
          tran: string
        }[]
        wfs?: {
          wf?: {
            name: string
            value: string
          }
        }[]
        'return-phrase'?: string
        usspeech?: string
      }
    }
  }
  translateResult: {
    tgt: string
    src: string
    srcPronounce?: string
    tgtPronounce?: string
  }[][]
  type: string
}
