import { Common } from '../common.ts'
import whois from 'whois-raw'

import type { RouterMiddleware } from '@oak/oak'

// ============== 类型定义 ==============

interface RDAPEntity {
  objectClassName: string
  handle?: string
  roles?: string[]
  vcardArray?: [string, ...VCardProperty[]]
  entities?: RDAPEntity[]
}

type VCardProperty = [string, Record<string, unknown>, string, string | string[]]

interface RDAPEvent {
  eventAction: string
  eventDate: string
}

interface RDAPNameserver {
  ldhName: string
  objectClassName: string
}

interface RDAPResponse {
  objectClassName: string
  handle: string
  ldhName: string
  unicodeName?: string
  status: string[]
  events: RDAPEvent[]
  nameservers?: RDAPNameserver[]
  entities?: RDAPEntity[]
  secureDNS?: {
    delegationSigned: boolean
  }
  notices?: { title: string; description: string[] }[]
}

interface WhoisData {
  /** 域名 */
  domain: string
  /** Unicode 域名（如有中文域名） */
  unicode_domain?: string
  /** Punycode 域名 */
  punycode_domain?: string
  /** 域名状态列表 */
  status: string[]
  /** 注册商 */
  registrar?: string
  /** 注册人信息 */
  registrant?: {
    name?: string
    organization?: string
    email?: string
    country?: string
  }
  /** DNS 服务器列表 */
  nameservers: string[]
  /** DNSSEC 状态 */
  dnssec: boolean | string
  /** 注册时间（格式化） */
  created?: string
  /** 更新时间（格式化） */
  updated?: string
  /** 过期时间（格式化） */
  expires?: string
  /** 注册时间戳（毫秒） */
  created_at?: number
  /** 更新时间戳（毫秒） */
  updated_at?: number
  /** 过期时间戳（毫秒） */
  expires_at?: number
  /** 注册时长（毫秒，从注册到现在） */
  duration?: number
  /** 注册时长描述 */
  duration_desc?: string
}

interface CacheEntry<T> {
  data: T
  expiry: number
}

// ============== 常量配置 ==============

const CONFIG = {
  /** RDAP 请求超时时间 */
  RDAP_TIMEOUT: 8000,
  /** WHOIS 请求超时时间 */
  WHOIS_TIMEOUT: 10000,
  /** WHOIS 查询跟随重定向次数 */
  WHOIS_FOLLOW: 2,
  /** 缓存有效期（5分钟） */
  CACHE_TTL: 5 * 60 * 1000,
  /** 最大缓存条目数 */
  MAX_CACHE_SIZE: 100,
} as const

// 二级 TLD 后缀 - 使用 Set 进行 O(1) 查找
const SECOND_LEVEL_TLDS = new Set([
  // UK
  'co.uk',
  'org.uk',
  'me.uk',
  'ac.uk',
  'gov.uk',
  'ltd.uk',
  'plc.uk',
  'net.uk',
  'sch.uk',
  // AU
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'asn.au',
  'id.au',
  // CN
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'edu.cn',
  'ac.cn',
  // TW
  'com.tw',
  'net.tw',
  'org.tw',
  'edu.tw',
  'gov.tw',
  'idv.tw',
  // JP
  'co.jp',
  'or.jp',
  'ne.jp',
  'ac.jp',
  'ad.jp',
  'ed.jp',
  'go.jp',
  'gr.jp',
  'lg.jp',
  // HK
  'com.hk',
  'net.hk',
  'org.hk',
  'edu.hk',
  'gov.hk',
  'idv.hk',
  // KR
  'co.kr',
  'or.kr',
  'ne.kr',
  'ac.kr',
  're.kr',
  'go.kr',
  // SG
  'com.sg',
  'net.sg',
  'org.sg',
  'edu.sg',
  'gov.sg',
  'per.sg',
  // NZ
  'co.nz',
  'net.nz',
  'org.nz',
  'govt.nz',
  'ac.nz',
  'school.nz',
  'geek.nz',
  'gen.nz',
  'kiwi.nz',
  'maori.nz',
  // BR
  'com.br',
  'net.br',
  'org.br',
  'gov.br',
  'edu.br',
  'art.br',
  // MX
  'com.mx',
  'net.mx',
  'org.mx',
  'edu.mx',
  'gob.mx',
  // IN
  'co.in',
  'net.in',
  'org.in',
  'gen.in',
  'firm.in',
  'ind.in',
  'ac.in',
  'edu.in',
  'res.in',
  'gov.in',
  'mil.in',
  'nic.in',
  // RU
  'com.ru',
  'net.ru',
  'org.ru',
  'pp.ru',
  // ZA
  'co.za',
  'net.za',
  'org.za',
  'edu.za',
  'gov.za',
  // DE
  'com.de',
  // IL
  'co.il',
  'org.il',
  'net.il',
  'ac.il',
  'gov.il',
  'muni.il',
  'idf.il',
])

// WHOIS 字段映射 - 用于快速查找
const WHOIS_FIELD_MAP = {
  registrar: ['registrar', 'registrar name', 'sponsoring registrar', 'registrar organization'],
  registrantName: ['registrant name', 'registrant'],
  registrantOrg: ['registrant organization', 'registrant org'],
  registrantEmail: ['registrant email', 'registrant contact email'],
  registrantCountry: ['registrant country', 'registrant country/economy'],
  created: ['creation date', 'created', 'registration time', 'registered', 'created on'],
  updated: ['updated date', 'updated', 'last updated', 'modified'],
  expires: ['registry expiry date', 'expiration date', 'expiry date', 'expires', 'expiration time'],
  dnssec: ['dnssec', 'dnssec status'],
  status: ['domain status', 'status'],
  nameserver: ['name server', 'dns', 'nserver'],
} as const

class ServiceWhois {
  // 简单的 LRU 缓存
  private cache = new Map<string, CacheEntry<WhoisData>>()

  /**
   * 获取缓存，自动清理过期项
   */
  private getFromCache(key: string): WhoisData | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * 设置缓存，自动淘汰旧条目
   */
  private setCache(key: string, data: WhoisData): void {
    // 超出限制时删除最早的条目
    if (this.cache.size >= CONFIG.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + CONFIG.CACHE_TTL,
    })
  }

  /**
   * 将 Unicode 域名转为 Punycode（使用 URL API）
   */
  private toPunycode(domain: string): string {
    try {
      return new URL(`http://${domain}`).hostname
    } catch {
      return domain.toLowerCase()
    }
  }

  /**
   * 将 Punycode 域名转为 Unicode
   */
  private toUnicode(domain: string): string {
    if (!domain.includes('xn--')) return domain

    try {
      // 利用 URL API 的自动转换
      const parts = domain.split('.')
      return parts
        .map((part) => {
          if (!part.startsWith('xn--')) return part
          try {
            return new URL(`http://${part}.test`).hostname.replace('.test', '')
          } catch {
            return part
          }
        })
        .join('.')
    } catch {
      return domain
    }
  }

  /**
   * 提取根域名（优化版）
   */
  private extractRootDomain(domain: string): string {
    // 清理域名
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .toLowerCase()

    const parts = cleanDomain.split('.')
    if (parts.length <= 2) return cleanDomain

    // 检查二级 TLD
    const lastTwo = `${parts.at(-2)}.${parts.at(-1)}`
    if (SECOND_LEVEL_TLDS.has(lastTwo)) {
      return parts.slice(-3).join('.')
    }

    return parts.slice(-2).join('.')
  }

  /**
   * 从 RDAP 响应中提取联系人信息（优化遍历）
   */
  private extractContact(entities?: RDAPEntity[]): WhoisData['registrant'] {
    const registrant = entities?.find((e) => e.roles?.includes('registrant'))
    const vcard = registrant?.vcardArray?.[1]
    if (!vcard) return undefined

    const result: NonNullable<WhoisData['registrant']> = {}

    for (const prop of vcard) {
      if (!Array.isArray(prop)) continue
      const [propName, , , value] = prop

      switch (propName) {
        case 'fn':
          if (typeof value === 'string') result.name = value
          break
        case 'org':
          if (typeof value === 'string') result.organization = value
          break
        case 'adr':
          if (Array.isArray(value) && value[6]) result.country = value[6]
          break
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  /**
   * 从 RDAP 响应中提取注册商信息
   */
  private extractRegistrar(entities?: RDAPEntity[]): string | undefined {
    const registrar = entities?.find((e) => e.roles?.includes('registrar'))
    if (!registrar) return undefined

    const vcard = registrar.vcardArray?.[1]
    if (vcard) {
      const fnProp = vcard.find((p) => Array.isArray(p) && p[0] === 'fn')
      if (fnProp && typeof fnProp[3] === 'string') return fnProp[3]
    }

    return registrar.handle
  }

  /**
   * 解析原始 WHOIS 数据（优化版 - 单次遍历）
   */
  private parseRawWhois(raw: string, domain: string): WhoisData {
    const lines = raw.split('\n')
    const fieldData: Record<string, string> = {}
    const status: string[] = []
    const nameservers: string[] = []

    // 单次遍历提取所有数据
    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const key = line.slice(0, colonIndex).trim().toLowerCase()
      const value = line.slice(colonIndex + 1).trim()
      if (!key || !value) continue

      // 提取状态（可能有多个）
      if (WHOIS_FIELD_MAP.status.includes(key as any)) {
        const statusValue = value.split(/\s+/)[0]
        if (statusValue && !status.includes(statusValue)) {
          status.push(statusValue)
        }
        continue
      }

      // 提取 DNS 服务器（可能有多个）
      if (WHOIS_FIELD_MAP.nameserver.includes(key as any)) {
        const ns = value.toLowerCase()
        if (!nameservers.includes(ns)) {
          nameservers.push(ns)
        }
        continue
      }

      // 其他字段只保留第一个值
      if (!fieldData[key]) {
        fieldData[key] = value
      }
    }

    // 辅助函数：查找字段值
    const findField = (keys: readonly string[]): string | undefined => {
      for (const key of keys) {
        if (fieldData[key]) return fieldData[key]
      }
      return undefined
    }

    // 辅助函数：解析日期
    const parseDate = (raw: string | undefined): { formatted?: string; timestamp?: number } => {
      if (!raw) return {}
      try {
        const date = new Date(raw)
        if (!isNaN(date.getTime())) {
          return { formatted: Common.localeTime(date), timestamp: date.getTime() }
        }
      } catch {}
      return { formatted: raw }
    }

    const createdDate = parseDate(findField(WHOIS_FIELD_MAP.created))
    const updatedDate = parseDate(findField(WHOIS_FIELD_MAP.updated))
    const expiresDate = parseDate(findField(WHOIS_FIELD_MAP.expires))

    const registrantName = findField(WHOIS_FIELD_MAP.registrantName)
    const registrantOrg = findField(WHOIS_FIELD_MAP.registrantOrg)
    const registrantEmail = findField(WHOIS_FIELD_MAP.registrantEmail)
    const registrantCountry = findField(WHOIS_FIELD_MAP.registrantCountry)

    const result: WhoisData = {
      domain: domain.toUpperCase(),
      status,
      registrar: findField(WHOIS_FIELD_MAP.registrar),
      nameservers,
      dnssec: findField(WHOIS_FIELD_MAP.dnssec) || 'unsigned',
    }

    // 添加注册人信息
    if (registrantName || registrantOrg || registrantEmail || registrantCountry) {
      result.registrant = {
        ...(registrantName && { name: registrantName }),
        ...(registrantOrg && { organization: registrantOrg }),
        ...(registrantEmail && { email: registrantEmail }),
        ...(registrantCountry && { country: registrantCountry }),
      }
    }

    // 添加日期和注册时长
    if (createdDate.formatted) {
      result.created = createdDate.formatted
      result.created_at = createdDate.timestamp
      if (createdDate.timestamp) {
        result.duration = Date.now() - createdDate.timestamp
        result.duration_desc = this.formatDuration(result.duration)
      }
    }
    if (updatedDate.formatted) {
      result.updated = updatedDate.formatted
      result.updated_at = updatedDate.timestamp
    }
    if (expiresDate.formatted) {
      result.expires = expiresDate.formatted
      result.expires_at = expiresDate.timestamp
    }

    return result
  }

  /**
   * 使用 whois-raw 获取域名信息
   */
  private fetchWhoisRaw(domain: string): Promise<WhoisData> {
    return new Promise((resolve, reject) => {
      const options = { follow: CONFIG.WHOIS_FOLLOW, timeout: CONFIG.WHOIS_TIMEOUT }

      whois.lookup(domain, options, (err: Error | null, data: string) => {
        if (err) {
          return reject(new Error(`WHOIS 查询失败: ${err.message}`))
        }

        if (!data || /No match for|NOT FOUND|No Data Found/i.test(data)) {
          return reject(new Error(`域名 ${domain} 未找到或未注册`))
        }

        try {
          resolve(this.parseRawWhois(data, domain))
        } catch (e: any) {
          reject(new Error(`WHOIS 数据解析失败: ${e.message}`))
        }
      })
    })
  }

  /**
   * 从 RDAP 获取域名信息（带超时控制）
   */
  private async fetchRDAP(domain: string): Promise<WhoisData> {
    const punycodeDomain = this.toPunycode(domain)
    const rootDomain = this.extractRootDomain(punycodeDomain)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.RDAP_TIMEOUT)

    try {
      const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, {
        headers: {
          Accept: 'application/rdap+json',
          'User-Agent': Common.chromeUA,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(
          response.status === 404 ? `域名 ${rootDomain} 未找到或未注册` : `RDAP 查询失败: ${response.status}`,
        )
      }

      const data: RDAPResponse = await response.json()
      return this.parseRDAPResponse(data)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 解析 RDAP 响应
   */
  private parseRDAPResponse(data: RDAPResponse): WhoisData {
    // 提取事件日期
    const events = new Map(data.events?.map((e) => [e.eventAction, e.eventDate]))

    const createdAt = events.get('registration')
    const updatedAt = events.get('last changed') || events.get('last update of RDAP database')
    const expiresAt = events.get('expiration')

    const unicodeDomain = data.unicodeName || this.toUnicode(data.ldhName)
    const isPunycode = data.ldhName !== unicodeDomain

    const result: WhoisData = {
      domain: data.ldhName,
      status: data.status || [],
      registrar: this.extractRegistrar(data.entities),
      registrant: this.extractContact(data.entities),
      nameservers: data.nameservers?.map((ns) => ns.ldhName.toLowerCase()) || [],
      dnssec: data.secureDNS?.delegationSigned ?? false,
    }

    // 添加 Unicode/Punycode 信息
    if (isPunycode) {
      result.unicode_domain = unicodeDomain
      result.punycode_domain = data.ldhName
    }

    // 格式化日期并计算注册时长
    if (createdAt) {
      const timestamp = new Date(createdAt).getTime()
      result.created = Common.localeTime(createdAt)
      result.created_at = timestamp
      result.duration = Date.now() - timestamp
      result.duration_desc = this.formatDuration(result.duration)
    }
    if (updatedAt) {
      result.updated = Common.localeTime(updatedAt)
      result.updated_at = new Date(updatedAt).getTime()
    }
    if (expiresAt) {
      result.expires = Common.localeTime(expiresAt)
      result.expires_at = new Date(expiresAt).getTime()
    }

    return result
  }

  /**
   * 获取域名 WHOIS 信息（带缓存和降级策略）
   */
  private async fetchWhois(domain: string): Promise<WhoisData> {
    const punycodeDomain = this.toPunycode(domain)
    const rootDomain = this.extractRootDomain(punycodeDomain)
    const cacheKey = rootDomain.toLowerCase()

    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const unicodeDomain = this.toUnicode(rootDomain)
    const isPunycode = rootDomain !== unicodeDomain

    try {
      // 先尝试 RDAP
      const result = await this.fetchRDAP(domain)

      // 如果 RDAP 返回的数据不完整，尝试用 whois-raw 补充
      if (!result.registrar || !result.created || result.nameservers.length === 0) {
        await this.supplementWithRawWhois(result, rootDomain)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (rdapError: any) {
      // RDAP 失败，降级到 whois-raw
      console.log('[whois] RDAP 查询失败，降级到 whois-raw:', rdapError.message)

      const result = await this.fetchWhoisRaw(rootDomain)

      // 添加 Unicode/Punycode 信息
      if (isPunycode) {
        result.unicode_domain = unicodeDomain
        result.punycode_domain = rootDomain
        result.domain = unicodeDomain
      }

      this.setCache(cacheKey, result)
      return result
    }
  }

  /**
   * 用原始 WHOIS 数据补充缺失字段
   */
  private async supplementWithRawWhois(result: WhoisData, rootDomain: string): Promise<void> {
    try {
      const rawResult = await this.fetchWhoisRaw(rootDomain)

      // 合并数据，RDAP 优先
      result.registrar ??= rawResult.registrar
      result.created ??= rawResult.created
      result.created_at ??= rawResult.created_at
      result.expires ??= rawResult.expires
      result.expires_at ??= rawResult.expires_at
      result.registrant ??= rawResult.registrant

      if (result.nameservers.length === 0) {
        result.nameservers = rawResult.nameservers
      }
    } catch {
      // 忽略 whois-raw 补充失败
    }
  }

  handle(): RouterMiddleware<'/whois'> {
    return async (ctx) => {
      const domain = ctx.request.url.searchParams.get('domain')?.trim()

      if (!domain) {
        return Common.requireArguments('domain', ctx.response)
      }

      try {
        const data = await this.fetchWhois(domain)
        this.formatResponse(ctx, data)
      } catch (e: any) {
        console.error('[whois]', e)
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, e.message || 'WHOIS 查询失败')
      }
    }
  }

  /**
   * 格式化响应
   */
  private formatResponse(ctx: any, data: WhoisData): void {
    switch (ctx.state.encoding) {
      case 'text':
        ctx.response.body = this.formatText(data)
        break

      case 'markdown':
        ctx.response.body = this.formatMarkdown(data)
        break

      case 'json':
      default:
        ctx.response.body = Common.buildJson(data)
    }
  }

  /**
   * 格式化为纯文本
   */
  private formatText(data: WhoisData): string {
    return [
      `域名: ${data.unicode_domain || data.domain}`,
      data.punycode_domain && `Punycode: ${data.punycode_domain}`,
      `状态: ${data.status.join(', ') || '未知'}`,
      data.registrar && `注册商: ${data.registrar}`,
      data.registrant?.organization && `注册人: ${data.registrant.organization}`,
      data.registrant?.email && `邮箱: ${data.registrant.email}`,
      data.registrant?.country && `国家: ${data.registrant.country}`,
      data.nameservers.length && `DNS服务器: ${data.nameservers.join(', ')}`,
      `DNSSEC: ${this.formatDnssec(data.dnssec)}`,
      data.created && `注册时间: ${data.created}`,
      data.duration !== undefined && `注册时长: ${this.formatDuration(data.duration)}`,
      data.updated && `更新时间: ${data.updated}`,
      data.expires && `过期时间: ${data.expires}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  /**
   * 格式化为 Markdown
   */
  private formatMarkdown(data: WhoisData): string {
    const title = data.unicode_domain ? `${data.unicode_domain} (${data.punycode_domain || data.domain})` : data.domain

    const rows = [
      `| **状态** | ${data.status.join(', ') || '未知'} |`,
      data.registrar && `| **注册商** | ${data.registrar} |`,
      data.registrant?.organization && `| **注册人** | ${data.registrant.organization} |`,
      data.registrant?.email && `| **邮箱** | ${data.registrant.email} |`,
      data.registrant?.country && `| **国家** | ${data.registrant.country} |`,
      `| **DNSSEC** | ${this.formatDnssec(data.dnssec, true)} |`,
      data.created && `| **注册时间** | ${data.created} |`,
      data.duration !== undefined && `| **注册时长** | ${this.formatDuration(data.duration)} |`,
      data.updated && `| **更新时间** | ${data.updated} |`,
      data.expires && `| **过期时间** | ${data.expires} |`,
    ].filter(Boolean)

    let md = `# 🔍 WHOIS 查询\n\n## ${title}\n\n| 字段 | 值 |\n|------|------|\n${rows.join('\n')}`

    if (data.nameservers.length) {
      md += `\n\n### DNS 服务器\n\n${data.nameservers.map((ns) => `- \`${ns}\``).join('\n')}`
    }

    return md
  }

  /**
   * 格式化 DNSSEC 状态
   */
  private formatDnssec(dnssec: boolean | string, markdown = false): string {
    if (typeof dnssec === 'boolean') {
      if (markdown) {
        return dnssec ? '✅ 已签名' : '❌ 未签名'
      }
      return dnssec ? '已签名' : '未签名'
    }
    // 字符串形式
    const isEnabled = dnssec.toLowerCase().includes('signed') && !dnssec.toLowerCase().includes('unsigned')
    if (markdown) {
      return isEnabled ? `✅ ${dnssec}` : `❌ ${dnssec}`
    }
    return dnssec
  }

  /**
   * 格式化时长（毫秒转为可读文本）
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const years = Math.floor(days / 365)
    const remainingDays = days % 365

    if (years > 0) {
      return remainingDays > 0 ? `${years} 年 ${remainingDays} 天` : `${years} 年`
    }
    if (days > 0) {
      return `${days} 天`
    }
    if (hours > 0) {
      return `${hours} 小时`
    }
    if (minutes > 0) {
      return `${minutes} 分钟`
    }
    return `${seconds} 秒`
  }
}

export const serviceWhois = new ServiceWhois()
