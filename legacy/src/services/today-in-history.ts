import { wrapperBaseRes } from '../utils.ts'

export async function fetchTodayInHistory(type: string) {
  const isText = type === 'text'
  const res = await fetch(`https://baike.deno.dev/today_in_history?encoding=${type}`)
  const content = await res[isText ? 'text' : 'json']()
  return isText ? content : wrapperBaseRes(content?.data ?? {})
}
