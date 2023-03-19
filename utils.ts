const defaultTips = '数据均来自官方，实时更新, 接口开源地址: https://github.com/vikiboss/60s'

export function responseWithBaseRes(obj: any, status = 200, message = defaultTips) {
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
