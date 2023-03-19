import { responseWithBaseRes } from '../utils.ts'

const api = 'https://weibo.com/ajax/side/hotSearch'

export async function fetchWeibo(isText = false) {
  const { data = {} } = await (await fetch(api)).json()
  const list: any[] = data?.realtime?.filter((e: any) => !e.is_ad) ?? []
  return isText ? list.map((e, i) => `${i + 1}. ${e?.word}`).join('\n') : responseWithBaseRes(list)
}

// 另一个可选的官方接口：

// const response = await fetch('https://api.weibo.cn/2/guest/cardlist', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   },
//   body: 'containerid=106003type%3D25%26filter_type%3Drealtimehot'
// })
