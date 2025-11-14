import { Buffer } from 'node:buffer'
import { Common } from '../../common.ts'
import qrcode, { type Params } from 'yaqrcode'

import type { RouterMiddleware } from '@oak/oak'

class ServiceQRCode {
  handle(): RouterMiddleware<'/qrcode'> {
    return async (ctx) => {
      const text = await Common.getParam('text', ctx.request)

      if (!text) {
        return Common.requireArguments('text', ctx.response)
      }

      const size = await Common.getParam('size', ctx.request)
      const level = await Common.getParam('level', ctx.request)
      const type = await Common.getParam('type', ctx.request)

      const dataURI = qrcode(text, {
        size: size ? Number.parseInt(size) : 256,
        errorCorrectLevel: (level || 'M').toUpperCase() as 'L' | 'M' | 'Q' | 'H',
        typeNumber: type ? (Number.parseInt(type) as Params['typeNumber']) : undefined,
      })

      const rawBase64 = dataURI.split(',')[1] || ''

      switch (ctx.state.encoding) {
        case 'text': {
          ctx.response.body = rawBase64
          break
        }

        case 'markdown': {
          ctx.response.body = `# 📱 二维码生成\n\n**内容**: ${text}\n\n**尺寸**: ${size || 256}px\n\n**纠错级别**: ${(level || 'M').toUpperCase()}\n\n![QR Code](${dataURI})`
          break
        }

        case 'json': {
          ctx.response.body = Common.buildJson({
            mime_type: 'image/gif',
            text: text,
            base64: rawBase64,
            data_uri: dataURI,
          })
          break
        }

        case 'image':
        default: {
          ctx.response.headers.set('Content-Type', 'image/gif')
          ctx.response.body = Buffer.from(rawBase64, 'base64')
          break
        }
      }
    }
  }
}

export const serviceQRCode = new ServiceQRCode()
