import { customAlphabet } from './deps.ts'

const defaultTips = '数据来自官方，实时更新, 代码开源地址: https://github.com/vikiboss/60s'
const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz'

export const randomId = (size: number) => customAlphabet(alphabet, size)

export function responseWithBaseRes(obj: any, message = defaultTips, status = 200) {
  return {
    status,
    message,
    data: obj || {}
  }
}

export function transferText(str: string, mode: 'u2a' | 'a2u') {
  if (mode === 'a2u') {
    return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
  } else {
    return str.replace(/./, _ => `&#${_.charCodeAt(0)};`)
  }
}
