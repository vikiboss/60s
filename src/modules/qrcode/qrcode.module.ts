import { Buffer } from 'node:buffer'
import { Common } from '../../common.ts'
import qrcode, { type Params } from 'yaqrcode'

import type { AppContext } from '../../types.ts'

class ServiceQRCode {
  async handle(ctx: AppContext) {
    const text = await Common.getParam('text', ctx)

    if (!text) {
      return Common.requireArguments('text')
    }

    const size = await Common.getParam('size', ctx)
    const level = await Common.getParam('level', ctx)
    const type = await Common.getParam('type', ctx)

    const dataURI = qrcode(text, {
      size: size ? Number.parseInt(size) : 256,
      errorCorrectLevel: (level || 'M').toUpperCase() as 'L' | 'M' | 'Q' | 'H',
      typeNumber: type ? (Number.parseInt(type) as Params['typeNumber']) : undefined,
    })

    const rawBase64 = dataURI.split(',')[1] || ''

    switch (ctx.encoding) {
      case 'text': {
        return rawBase64
      }

      case 'markdown': {
        return `# 📱 二维码生成\n\n**内容**: ${text}\n\n**尺寸**: ${size || 256}px\n\n**纠错级别**: ${(level || 'M').toUpperCase()}\n\n![QR Code](${dataURI})`
      }

      case 'json': {
        return Common.buildJson({
          mime_type: 'image/gif',
          text: text,
          base64: rawBase64,
          data_uri: dataURI,
        })
      }

      case 'image':
      default: {
        ctx.set.headers['content-type'] = 'image/gif'
        return Buffer.from(rawBase64, 'base64')
      }
    }
  }
}

export const serviceQRCode = new ServiceQRCode()
