import crypto from 'node:crypto'
import { Common } from '../../common.ts'

import type { AppContext } from '../../types.ts'

class ServiceFanyi {
  public static langMap = new Map<string, { label: string; code: string; alphabet: string }>()

  async handle(ctx: AppContext) {
    const text = await Common.getParam('text', ctx, true)

    if (!text) {
      return Common.requireArguments('text')
    }

    const from = (await Common.getParam('from', ctx, true)) || 'auto'
    const to = (await Common.getParam('to', ctx, true)) || 'auto'

    if (!this.isLangValid(from, to)) {
      ctx.set.status = 400
      return Common.buildJson(null, 400, '不支持的语言类型，请通过 /fanyi/langs 接口查询支持的语言类型')
    }

    const data = await this.#fetch(text, from, to)
    const isSuccess = data.code === 0
    const responseItems = data?.translateResult?.flat() || []

    ctx.set.status = isSuccess ? 200 : 500
    const [sourceType, targetType] = data?.type?.split('2') || []

    switch (ctx.encoding) {
      case 'text':
        return isSuccess ? responseItems.map((e) => e.tgt).join('') || '' : '[翻译服务异常]'
        break

      case 'markdown': {
        if (!isSuccess) {
          return '# 翻译服务异常'
          break
        }
        const sourceText = responseItems.map((e) => e.src).join('') || ''
        const targetText = responseItems.map((e) => e.tgt).join('') || ''
        const sourcePronounce = responseItems.map((e) => e.srcPronounce).join('') || ''
        const targetPronounce = responseItems.map((e) => e.tgtPronounce).join('') || ''
        const sourceLang = ServiceFanyi.langMap.get(sourceType)?.label || sourceType
        const targetLang = ServiceFanyi.langMap.get(targetType)?.label || targetType
        return `# 🌐 翻译结果\n\n## 原文 (${sourceLang})\n\n> ${sourceText}\n\n${sourcePronounce ? `*发音: ${sourcePronounce}*\n\n` : ''}## 译文 (${targetLang})\n\n> ${targetText}\n\n${targetPronounce ? `*发音: ${targetPronounce}*` : ''}`
        break
      }

      case 'json':
      default:
        return isSuccess
          ? Common.buildJson({
              source: {
                text: responseItems.map((e) => e.src).join('') || '',
                type: sourceType,
                type_desc: ServiceFanyi.langMap.get(sourceType)?.label || '',
                pronounce: responseItems.map((e) => e.srcPronounce).join('') || '',
              },
              target: {
                text: responseItems.map((e) => e.tgt).join('') || '',
                type: targetType,
                type_desc: ServiceFanyi.langMap.get(targetType)?.label || '',
                pronounce: responseItems.map((e) => e.tgtPronounce).join('') || '',
              },
            })
          : Common.buildJson(null, 500, `翻译服务异常，调试信息: ${JSON.stringify(data)}`)
        break
    }
  }

  async handleLangs() {
    return Common.buildJson([...ServiceFanyi.langMap.values()].toSorted((a, b) => a.alphabet.localeCompare(b.alphabet)))
  }

  isLangValid(from: string, to: string) {
    return (from === 'auto' || ServiceFanyi.langMap.has(from)) && (to === 'auto' || ServiceFanyi.langMap.has(to))
  }

  static async initLangs() {
    const api = 'https://api-overmind.youdao.com/openapi/get/luna/dict/luna-front/prod/langType'
    const { data = {} } = (await (await fetch(api)).json()) || {}
    const langs = [...(data?.value?.textTranslate?.common || []), ...(data?.value?.textTranslate?.specify || [])]

    for (const lang of langs) {
      ServiceFanyi.langMap.set(lang.code, lang)
    }

    // const date = new Date().toLocaleString('zh-CN')
    // console.log(`[${date}] [fanyi] 语言列表初始化完成，共 ${ServiceFanyi.langMap.size} 种语言`)
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

ServiceFanyi.initLangs()
