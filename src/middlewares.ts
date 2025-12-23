import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

import { config } from './config.ts'
import { Common } from './common.ts'
import { serviceIP } from './modules/ip.module.ts'

// 黑名单 IP 列表
// deno-lint-ignore no-process-global
const blacklistIPs: string[] = process.env.BLACKLIST_IPS ? JSON.parse(process.env.BLACKLIST_IPS) : []

/**
 * 共享中间件插件 - 用于所有入口
 * 包含: 错误处理、CORS、日志、黑名单、favicon、encoding
 */
export const middlewares = new Elysia({ name: 'middlewares' })
  // 全局错误处理
  .onError(({ error, code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404
      return Common.buildJson(
        null,
        404,
        `404, 接口被吃掉了，请检查！应用接口需要在 Base URL 后面带上版本号，如 /v2/60s`,
      )
    }

    console.error(error)
    set.status = 500
    const message = `服务器出错了... ${'message' in error ? error.message : error}`
    return Common.buildJson(null, 500, message)
  })
  .use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['*'] }))
  .onRequest(({ request }) => {
    const ua = request.headers.get('user-agent') || '-'
    const ip = serviceIP.getClientIP(request.headers) || '-'
    const date = new Date().toLocaleString('zh-CN')
    const url = new URL(request.url)

    console.log(`[${date}] [${ua}]`)
    console.log(`[${date}] [${ip}] => ${url.href}`)
  })
  .onBeforeHandle(({ request, set }) => {
    const ua = request.headers.get('user-agent') || '-'
    const ip = serviceIP.getClientIP(request.headers) || '-'
    const url = new URL(request.url)

    if (ip && blacklistIPs.includes(ip)) {
      set.status = 403
      console.log(`[BLACKLIST] Blocked request from IP: ${ip}, URL: ${url}, UA: ${ua}`)
      return Common.buildJson(null, 403, `由于滥用等原因，该 IP (${ip}) 已被禁止，如有疑问请联系 ${config.author}`)
    }
  })
