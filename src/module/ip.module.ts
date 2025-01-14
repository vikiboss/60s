import type { RouterMiddleware } from '@oak/oak'

class ServiceIP {
  handle(): RouterMiddleware<'/ip'> {
    return ctx => {
      const requestHeaders = ctx.request.headers

      const xForwardedFor = requestHeaders.get('x-forwarded-for')?.split(',').shift()
      const clientIP = requestHeaders.get('http_client_ip')
      const remoteAddr = ctx.request.ip

      ctx.response.body = xForwardedFor || clientIP || remoteAddr
    }
  }
}

export const serviceIP = new ServiceIP()
