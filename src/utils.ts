import { customAlphabet } from 'nanoid'

const defaultTips = 'v1 版本即将在 2025/6/30 号后下线，请及时迁移到 v2。所有数据均来自官方，确保稳定与实时，用户群: 595941841，开源地址: https://github.com/vikiboss/60s'

export const randomId = (size: number) => customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', size)

export function wrapperBaseRes(obj: object, message = defaultTips, status = 200) {
  return {
    status,
    message,
    data: obj || {},
  }
}

export function transferText(str: string, mode: 'u2a' | 'a2u') {
  if (mode === 'a2u') {
    return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
  }
  return str.replace(/./, (_) => `&#${_.charCodeAt(0)};`)
}
