import { responseWithBaseRes } from '../utils.ts'

const api = 'https://www.zhihu.com/api/v4/search/top_search'

export async function fetchZhihu(type = 'json') {
  const { top_search = {} } = await (await fetch(api)).json()
  const list: any[] = top_search?.words ?? []
  const rawRes = list.map((e, i) => `${i + 1}. ${e?.word}`).join('\n')
  return type === 'json' ? responseWithBaseRes(list) : rawRes
}
