import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceIP {
  getClientIP(requestHeaders: Headers): string {
    const headerFields = ['x-forwarded-for', 'x-real-ip', 'x-client-ip', 'x-real-client-ip']

    for (const field of headerFields) {
      const value = requestHeaders.get(field)?.trim()

      if (value) {
        // 取逗号分隔的第一个 IP，去除空格
        const firstIP = value.split(',')[0].trim()
        if (firstIP) return firstIP
      }
    }

    return ''
  }

  // 检查是否为本地或内网 IP
  private isLocalIP(ip: string): boolean {
    if (!ip) return false

    // IPv6 本地地址
    if (ip === '::1' || ip.startsWith('::ffff:127.')) return true

    // IPv4 本地和内网地址
    if (ip === '127.0.0.1' || ip === 'localhost') return true

    // 私有网络地址段
    if (ip.startsWith('192.168.') || ip.startsWith('10.')) return true

    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (ip.startsWith('172.')) {
      const parts = ip.split('.')
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10)
        return secondOctet >= 16 && secondOctet <= 31
      }
    }

    return false
  }

  // 获取公网 IP
  private async getPublicIP(): Promise<string> {
    try {
      // 使用多个备用服务，提高可靠性
      const services = ['https://api.ipify.org?format=text', 'https://ifconfig.me/ip', 'https://icanhazip.com']

      for (const service of services) {
        try {
          const response = await fetch(service, { signal: AbortSignal.timeout(1000) })
          if (response.ok) {
            const ip = (await response.text()).trim()
            if (ip && !this.isLocalIP(ip)) return ip
          }
        } catch {
          continue
        }
      }

      return '' // 所有服务都失败时返回空字符串
    } catch {
      return ''
    }
  }

  handle(): RouterMiddleware<'/ip'> {
    return async (ctx) => {
      let ip = this.getClientIP(ctx.request.headers) || ctx.request.ip
      const inputIp = ctx.request.url.searchParams.get('ip') || ''

      // 优先使用请求参数中的 IP
      if (inputIp) {
        ip = inputIp
      }

      // 如果是本地 IP，尝试获取公网 IP
      if (!inputIp && this.isLocalIP(ip)) {
        const publicIP = await this.getPublicIP()

        if (publicIP) {
          ip = publicIP
        }
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = ip
          break

        case 'markdown': {
          const data = await this.fetchIpInfo(ip)
          ctx.response.body = `# 🌐 IP 地址查询\n\n## ${ip}\n\n${data.continent ? `**洲**: ${data.continent}\n\n` : ''}${data.country ? `**国家**: ${data.country}\n\n` : ''}${data.prov ? `**省份**: ${data.prov}\n\n` : ''}${data.city ? `**城市**: ${data.city}\n\n` : ''}${data.district ? `**区县**: ${data.district}\n\n` : ''}${data.isp ? `**运营商**: ${data.isp}` : ''}`
          break
        }

        case 'json':
        default: {
          const data = await this.fetchIpInfo(ip)
          ctx.response.body = Common.buildJson(data)
          break
        }
      }
    }
  }

  async fetchIpInfo(ip: string): Promise<IpInfo> {
    // https://qifu-api.baidubce.com/ip/geo/v1/district?ip=
    // 上述接口已失效，使用 ip.sb 接口简单 fallback 对齐，防止接口异常
    const data = await (await fetch('https://api.ip.sb/geoip')).json().catch(() => {})

    return {
      ip,
      continent: data?.continent_code || '',
      country: data?.country || '',
      zipcode: '',
      timezone: data?.timezone || '',
      accuracy: '',
      owner: '',
      isp: data?.isp || '',
      source: 'ip.sb',
      areacode: '',
      adcode: '',
      asnumber: String(data?.asn || ''),
      lat: data?.latitude || '',
      lng: data?.longitude || '',
      radius: '',
      prov: '',
      city: '',
      district: '',
    }
  }
}

interface IpInfo {
  ip: string // '222.79.47.25'
  continent: string // '亚洲'
  country: string // '中国'
  zipcode: string // '350007'
  timezone: string // 'UTC+8'
  accuracy: string // '区县'
  owner: string // '中国电信'
  isp: string // '中国电信'
  source: string // '数据挖掘'
  areacode: string // 'CN'
  adcode: string // '350104'
  asnumber: string // '4134'
  lat: string // '26.016978'
  lng: string // '119.323547'
  radius: string // '13.7621'
  prov: string // '福建省'
  city: string // '福州市'
  district: string // '仓山区'
}

export const serviceIP = new ServiceIP()
