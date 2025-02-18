import { gzipSync, unzipSync, deflateSync, inflateSync, brotliCompressSync, brotliDecompressSync } from 'node:zlib'
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceHash {
  handle(): RouterMiddleware<'/hash'> {
    return async (ctx) => {
      const content = await Common.getParam('content', ctx.request)

      if (!content) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, 'query 或者 body 的 `content` 参数不能为空')
        return
      }

      const data = {
        source: content,
        md5: Common.md5(content, 'hex'),
        sha: {
          sha1: this.sha1(content),
          sha256: this.sha256(content),
          sha512: this.sha512(content),
        },
        base64: {
          encoded: this.base64Encode(content),
          decoded: this.base64Decode(content),
        },
        url: {
          encoded: this.urlEncode(content),
          decoded: this.urlDecode(content),
        },
        gzip: {
          encoded: this.gzipEncode(content),
          decoded: this.gzipDecode(content),
        },
        deflate: {
          encoded: this.deflateEncode(content),
          decoded: this.deflateDecode(content),
        },
        brotli: {
          encoded: this.brotliEncode(content),
          decoded: this.brotliDecode(content),
        },
      }

      switch (ctx.state.encoding) {
        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break

        case 'text':
          ctx.response.body = `Hash 等编码转换结果\n\n${Object.entries(data)
            .map((e) => `${e[0]} => ${e[1]}`)
            .join('\n')}`
          break
      }
    }
  }

  sha1(content: string) {
    return crypto.createHash('sha1').update(content).digest('hex')
  }

  sha256(content: string) {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  sha512(content: string) {
    return crypto.createHash('sha512').update(content).digest('hex')
  }

  base64Encode(content: string) {
    return Buffer.from(content).toString('base64')
  }

  base64Decode(content: string) {
    try {
      return Buffer.from(content, 'base64').toString('utf8')
    } catch {
      return ''
    }
  }

  urlEncode(content: string) {
    return encodeURIComponent(content)
  }

  urlDecode(content: string) {
    return decodeURIComponent(content)
  }

  gzipEncode(content: string) {
    return gzipSync(Buffer.from(content)).toString('hex')
  }

  gzipDecode(content: string) {
    try {
      return unzipSync(Buffer.from(content.replace(/\s*/g, ''), 'hex')).toString('utf8')
    } catch {
      return ''
    }
  }

  deflateEncode(content: string) {
    return deflateSync(Buffer.from(content)).toString('hex')
  }

  deflateDecode(content: string) {
    try {
      return inflateSync(Buffer.from(content.replace(/\s*/g, ''), 'hex')).toString('utf8')
    } catch {
      return ''
    }
  }

  brotliEncode(content: string) {
    return brotliCompressSync(Buffer.from(content)).toString('hex')
  }

  brotliDecode(content: string) {
    try {
      return brotliDecompressSync(Buffer.from(content.replace(/\s*/g, ''), 'hex')).toString('utf8')
    } catch {
      return ''
    }
  }
}

export const serviceHash = new ServiceHash()
