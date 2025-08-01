import crypto from 'node:crypto'
import { Common } from '../../common.ts'

// stored from 'https://api-overmind.youdao.com/openapi/get/luna/dict/luna-front/prod/langType'
import langs from './langs.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

const langMap = Object.groupBy(langs, (e) => e.code)

class ServiceFanyi {
  handle(): RouterMiddleware<'/fanyi'> {
    return async (ctx) => {
      const text = await Common.getParam('text', ctx.request)

      if (!text) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, 'text 参数不能为空')
        return
      }

      const from = ctx.request.url.searchParams.get('from') || 'auto'
      const to = ctx.request.url.searchParams.get('to') || 'auto'

      const data = await this.#fetch(text, from, to)
      const isSuccess = data.code === 0
      const responseItems = data?.translateResult?.flat() || []

      ctx.response.status = isSuccess ? 200 : 500
      const [sourceType, targetType] = data?.type?.split('2') || []

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = isSuccess ? responseItems.map((e) => e.tgt).join('') || '' : '[翻译服务异常]'
          break

        case 'json':
        default:
          ctx.response.body = isSuccess
            ? Common.buildJson({
                source: {
                  text: responseItems.map((e) => e.src).join('') || '',
                  type: sourceType,
                  type_desc: langMap[sourceType]?.[0]?.label || '',
                  pronounce: responseItems.map((e) => e.srcPronounce).join('') || '',
                },
                target: {
                  text: responseItems.map((e) => e.tgt).join('') || '',
                  type: targetType,
                  type_desc: langMap[targetType]?.[0]?.label || '',
                  pronounce: responseItems.map((e) => e.tgtPronounce).join('') || '',
                },
              })
            : Common.buildJson(null, 500, `翻译服务异常，调试信息: ${JSON.stringify(data)}`)
          break
      }
    }
  }

  langs(): RouterMiddleware<'/fanyi/langs'> {
    return (ctx) => {
      ctx.response.body = Common.buildJson(langs)
    }
  }

  async #fetch(text: string, from: string, to: string) {
    function aesDecode(value: string) {
      const key = 'ydsecret://query/key/B*RGygVywfNBwpmBaZg*WT7SIOUP2T0C9WHMZN39j^DAdaZhAnxvGcCY6VYFwnHl'
      const iv = 'ydsecret://query/iv/C@lZe2YzHtZ2CYgaXKSVfsb7Y4QWHjITPPZ0nQp87fBeJ!Iv6v^6fvi2WN@bYpJ4'
      const encoder = crypto.createDecipheriv('aes-128-cbc', Common.md5(key, 'buffer'), Common.md5(iv, 'buffer'))
      return encoder.update(value, 'base64', 'utf-8') + encoder.final('utf-8')
    }

    function getCommonParams(secretKey: string) {
      const now = String(Date.now())
      return {
        sign: Common.md5(`client=fanyideskweb&mysticTime=${now}&product=webfanyi&key=${secretKey}`),
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
      const response = await fetch(
        `https://dict.youdao.com/webtranslate/key?${Common.qs({
          keyid: 'webfanyi-key-getter',
          ...getCommonParams('asdjnjfenknafdfsdfsd'),
        })}`,
      )
      const data = await response.json()
      return data?.data?.secretKey || ''
    }

    const response = await fetch('https://dict.youdao.com/webtranslate', {
      method: 'POST',
      headers: {
        cookie: 'OUTFOX_SEARCH_USER_ID_NCOO=2100336809.6038957; OUTFOX_SEARCH_USER_ID=711138426@112.20.94.181',
        referer: 'https://fanyi.youdao.com/',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: Common.qs({
        from,
        to,
        i: text,
        dictResult: true,
        keyid: 'webfanyi',
        ...getCommonParams(await getSecretKey()),
      }),
    })

    return JSON.parse(aesDecode(await response.text())) as YoudaoData
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
