import { wrapperBaseRes } from '../utils.ts'

const api = 'https://is-lq.snssdk.com/api/suggest_words/?business_id=10016'

export async function fetchToutiao(type = 'json') {
  const { data = [] } = await (await fetch(api)).json()
  // deno-lint-ignore no-explicit-any
  const list: any[] = data[0]?.words ?? []
  const rawRes = list.map((e, i) => `${i + 1}. ${e?.word}`).join('\n')
  return type === 'json' ? wrapperBaseRes(list) : rawRes
}
