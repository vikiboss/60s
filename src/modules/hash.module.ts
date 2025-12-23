import { gzipSync, unzipSync, deflateSync, inflateSync, brotliCompressSync, brotliDecompressSync } from 'node:zlib'
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { Common } from '../common.ts'

import type { AppContext } from '../types.ts'

class ServiceHash {
  async handle(ctx: AppContext) {
    const content = await Common.getParam('content', ctx, true)

    if (!content) {
      return Common.requireArguments('content')
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

    switch (ctx.encoding) {
      case 'text':
        return `Hash 等编码转换结果\n\n${Object.entries(data)
          .map((e) => `${e[0]} => ${e[1]}`)
          .join('\n')}`

      case 'markdown':
        return `# 🔐 Hash & 编码转换\n\n## 原始内容\n\n\`\`\`\n${data.source}\n\`\`\`\n\n## Hash 值\n\n**MD5**: \`${data.md5}\`\n\n**SHA1**: \`${data.sha.sha1}\`\n\n**SHA256**: \`${data.sha.sha256}\`\n\n**SHA512**: \`${data.sha.sha512}\`\n\n## 编码结果\n\n### Base64\n- **编码**: \`${data.base64.encoded}\`\n- **解码**: \`${data.base64.decoded}\`\n\n### URL\n- **编码**: \`${data.url.encoded}\`\n- **解码**: \`${data.url.decoded}\``

      case 'json':
      default:
        return Common.buildJson(data)
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
