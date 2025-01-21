import type { RouterMiddleware } from '@oak/oak'
import { Common } from '../common.ts'

class ServiceIP {
  getClientIP(requestHeaders: Headers): string {
    const headerFields = ['x-forwarded-for', 'x-client-ip', 'x-real-ip', 'x-real-client-ip']

    for (const field of headerFields) {
      const value = requestHeaders.get(field)

      if (value) {
        const ips = value.split(',').map((ip) => ip.trim())
        if (ips.length > 0) return ips[0]
      }
    }

    return ''
  }

  handle(): RouterMiddleware<'/ip'> {
    return (ctx) => {
      const clientIP = this.getClientIP(ctx.request.headers)
      const ip = clientIP || ctx.request.ip

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = ip
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({ ip })
          break
      }
    }
  }
}

export const serviceIP = new ServiceIP()
