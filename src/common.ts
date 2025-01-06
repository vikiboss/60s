import { config } from './config'

export class Common {
  static buildJson(
    data: boolean | number | string | object,
    code = 200,
    message = config.commonMessage
  ) {
    return {
      code,
      data,
      message,
    }
  }

  static localeDateStr(ts = Date.now(), locale = 'zh-CN', timeZone = 'Asia/Shanghai') {
    const today = new Date(ts)

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    })

    return formatter.format(today)
  }

  static localeTimeStr(ts = Date.now(), locale = 'zh-CN', timeZone = 'Asia/Shanghai') {
    const today = new Date(ts)

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone,
    })

    return formatter.format(today)
  }
}
