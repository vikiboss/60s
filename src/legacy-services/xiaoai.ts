import { randomId, responseWithBaseRes } from '../utils.ts'

const api = 'https://ai-voice.api.xiaomi.net/aivs/v2.2/text'

const deprecated = true

export async function fetchXiaoai(text = '你好', textOnly = false, type = 'json') {
  if (deprecated) {
    return {
      msg: '小爱同学接口已失效，请考虑使用其他接口或者 GPT',
    }
  }

  const params = {
    requestId: '',
    token: '',
    userId: `${randomId(8)}-${randomId(6)}-${randomId(6)}-${randomId(6)}-${randomId(8)}`,
  }

  const queryString = new URLSearchParams(params).toString()

  const config = {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    method: 'POST',
    body: JSON.stringify({ requestText: text }),
  }

  const { directive } = await (await fetch(`${api}?${queryString}`, config)).json()

  const res = {
    text: directive.displayText,
    audio: directive.url,
  }

  if (textOnly) {
    delete res.audio
  }

  if (type === 'json') {
    return responseWithBaseRes(res)
  } else {
    return directive.displayText
  }
}
