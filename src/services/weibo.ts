import { wrapperBaseRes } from '../utils.ts'

const api = 'https://weibo.com/ajax/side/hotSearch'

export async function fetchWeibo(type = 'json') {
  const { data = {} } = await (await fetch(api)).json()
  // deno-lint-ignore no-explicit-any
  const list: any[] = data?.realtime?.filter((e: any) => !e.is_ad) ?? []
  const rawRes = list.map((e, i) => `${i + 1}. ${e?.word}`).join('\n')
  return type === 'json' ? wrapperBaseRes(list) : rawRes
}

// 另一个可选的官方接口：

// const response = await fetch('https://api.weibo.cn/2/guest/cardlist', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   },
//   body: 'containerid=106003type%3D25%26filter_type%3Drealtimehot'
// })
