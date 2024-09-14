import { wrapperBaseRes } from '../utils.ts'

const api = 'https://www.zhihu.com/billboard'

export async function fetchZhihuHot(type = 'json') {
  const html = await (await fetch(api)).text()

  const jsonReg = /<script\s*id="js-initialData"\s*type="text\/json">\s*({"initialState":{[^<>]+}\s*})\s*<\/script>/g

  const data = JSON.parse(html.match(jsonReg)?.[0].replace(jsonReg, '$1') || '{}')
  const list = (data?.initialState?.topstory?.hotList || []).map((e: any) => ({
    title: e.target.titleArea.text,
    cover: e.target.imageArea.url,
    metrics: e.target.metricsArea.text,
    link: e.target.link.url,
  })) as any[]

  const rawRes = list.map((e: any, i) => `${i + 1}. ${e?.title}`).join('\n')
  return type === 'json' ? wrapperBaseRes(list) : rawRes
}
