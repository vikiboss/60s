import type { RouterMiddleware } from '@oak/oak'

class ServiceIP {
  private getClientIP(requestHeaders: Headers): string | undefined {
    const headerFields = ['x-forwarded-for', 'x-client-ip', 'x-real-ip', 'x-real-client-ip']

    for (const field of headerFields) {
      const value = requestHeaders.get(field)

      if (value) {
        const ips = value.split(',').map(ip => ip.trim())
        if (ips.length > 0) return ips[0]
      }
    }

    return undefined
  }

  handle(): RouterMiddleware<'/ip'> {
    return ctx => {
      const clientIP = this.getClientIP(ctx.request.headers)

      try {
        ctx.response.body = clientIP || ctx.request.ip
      } catch (e) {
        console.error(e)
        ctx.response.body = ''
      }
    }
  }
}

export const serviceIP = new ServiceIP()
