import { wrapperBaseRes } from '../utils.ts'

export async function fetchBaike(item: string, type: string) {
  const isText = type === 'text'
  const res = await fetch(`https://baike.deno.dev/item/${encodeURIComponent(item)}?encoding=${type}`)
  const content = await res[isText ? 'text' : 'json']()
  return isText ? content : wrapperBaseRes(content?.data ?? {})
}
