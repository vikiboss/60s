import { wrapperBaseRes } from '../utils.ts'

const api = 'https://app.bilibili.com/x/v2/search/trending/ranking'

export async function fetchBili(type = 'json') {
  const { data = {} } = await (await fetch(api)).json()

  const list: any[] = data?.list?.filter((e: any) => e?.is_commercial === '0') ?? []

  if (type === 'json') {
    return wrapperBaseRes(list)
  }

  return list.map((e, i) => `${i + 1}. ${e.show_name}`).join('\n')
}
