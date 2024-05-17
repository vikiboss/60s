import { Context, Next } from '@oak/oak'

const encodes = ['e', 'encode', 'encoding']

export default async function encodings(ctx: Context, next: Next) {
  console.log(ctx.request.url) // for debug

  const { searchParams } = new URL(ctx.request.url)

  const isJson = encodes.some((e) => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['json', 'JSON', 'Json'].includes(value)
  })

  const isImage = encodes.some((e) => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['image', 'img'].includes(value)
  })

  const isText = encodes.some((e) => {
    const value = searchParams.get(e)?.toLowerCase() || ''
    return value && ['text', 'txt', 'raw'].includes(value)
  })

  ctx.state.type = isImage ? 'image' : isJson ? 'json' : isText ? 'text' : 'json'

  await next()
}
