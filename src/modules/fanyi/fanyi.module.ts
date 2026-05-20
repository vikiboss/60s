import crypto from 'node:crypto'
import { Common } from '../../common.ts'
import langData from './langs.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceFanyi {
  langMap = new Map<string, { label: string; code: string; alphabet: string }>()

  handle(): RouterMiddleware<'/fanyi'> {
    this.initLangs()

    return async (ctx) => {
      const text = await Common.getParam('text', ctx.request, true)

      if (!text) {
        return Common.requireArguments('text', ctx.response)
      }

      const from = (await Common.getParam('from', ctx.request, true)) || 'auto'
      const to = (await Common.getParam('to', ctx.request, true)) || 'auto'

      if (!this.isLangValid(from, to)) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '不支持的语言类型，请通过 /fanyi/langs 接口查询支持的语言类型')
        return
      }

      const data = await this.#fetch(text, from, to)
      const isSuccess = data.code === 0
      const responseItems = data?.translateResult?.flat() || []

      ctx.response.status = isSuccess ? 200 : 500
      const [sourceType, targetType] = data?.type?.split('2') || []

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = isSuccess ? responseItems.map((e) => e.tgt).join('') || '' : '[翻译服务异常]'
          break

        case 'markdown': {
          if (!isSuccess) {
            ctx.response.body = '# 翻译服务异常'
            break
          }
          const sourceText = responseItems.map((e) => e.src).join('') || ''
          const targetText = responseItems.map((e) => e.tgt).join('') || ''
          const sourcePronounce = responseItems.map((e) => e.srcPronounce).join('') || ''
          const targetPronounce = responseItems.map((e) => e.tgtPronounce).join('') || ''
          const sourceLang = this.langMap.get(sourceType)?.label || sourceType
          const targetLang = this.langMap.get(targetType)?.label || targetType
          ctx.response.body = `# 🌐 翻译结果\n\n## 原文 (${sourceLang})\n\n> ${sourceText}\n\n${sourcePronounce ? `*发音: ${sourcePronounce}*\n\n` : ''}## 译文 (${targetLang})\n\n> ${targetText}\n\n${targetPronounce ? `*发音: ${targetPronounce}*` : ''}`
          break
        }

        case 'json':
        default:
          ctx.response.body = isSuccess
            ? Common.buildJson({
                source: {
                  text: responseItems.map((e) => e.src).join('') || '',
                  type: sourceType,
                  type_desc: this.langMap.get(sourceType)?.label || '',
                  pronounce: responseItems.map((e) => e.srcPronounce).join('') || '',
                },
                target: {
                  text: responseItems.map((e) => e.tgt).join('') || '',
                  type: targetType,
                  type_desc: this.langMap.get(targetType)?.label || '',
                  pronounce: responseItems.map((e) => e.tgtPronounce).join('') || '',
                },
              })
            : Common.buildJson(null, 500, `翻译服务异常，调试信息: ${JSON.stringify(data)}`)
          break
      }
    }
  }

  handleLangs(): RouterMiddleware<'/fanyi/langs'> {
    return (ctx) => {
      ctx.response.body = Common.buildJson(
        [...this.langMap.values()].toSorted((a, b) => a.alphabet.localeCompare(b.alphabet)),
      )
    }
  }

  isLangValid(from: string, to: string) {
    return (from === 'auto' || this.langMap.has(from)) && (to === 'auto' || this.langMap.has(to))
  }

  async initLangs() {
    const api = 'https://api-overmind.youdao.com/openapi/get/luna/dict/luna-front/prod/langType'

    const { data = {} } = await fetch(api)
      .then((e) => e.json())
      .catch(() => ({}))

    const langs = [...(data?.value?.textTranslate?.common || []), ...(data?.value?.textTranslate?.specify || [])]

    for (const lang of langs) {
      this.langMap.set(lang.code, lang)
    }

    if (this.langMap.size <= 0) {
      const date = new Date().toLocaleString('zh-CN')

      const langs = [
        ...(langData.data.value.textTranslate.common || []),
        ...(langData.data.value.textTranslate.specify || []),
      ]

      for (const lang of langs) {
        this.langMap.set(lang.code, lang)
      }

      console.error(`[${date}] [fanyi] 语言列表初始化失败，回退到内置语言列表，共 ${langs.length} 种语言`)
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
