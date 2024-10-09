import type { Context, Next } from '@oak/oak'

const encodesMap = {
  json: ['json', 'JSON', 'Json'] as string[],
  image: ['image', 'img'] as string[],
  text: ['text', 'txt', 'raw'] as string[],
} as const

type EncodeType = keyof typeof encodesMap

const encodeParamNames = ['e', 'encode', 'encoding']
const encodesTypes = Object.keys(encodesMap) as EncodeType[]

export default async function formatEncodingParam(ctx: Context, next: Next) {
  const { searchParams } = new URL(ctx.request.url)

  const encode = encodeParamNames.find((key) => searchParams.has(key))
  const encodeValue = encode && searchParams.get(encode)

  if (!encodeValue) {
    ctx.state.type = 'json'
  } else {
    ctx.state.type = encodesTypes.find((key) => encodesMap[key].includes(encodeValue)) || 'json'
  }

  await next()
}
