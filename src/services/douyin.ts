import { wrapperBaseRes } from '../utils.ts'

const api = 'https://aweme-lq.snssdk.com/aweme/v1/hot/search/list/?aid=1128&version_code=880'

export async function fetchDouyin(type = 'json') {
  const { data = {} } = await (await fetch(api)).json()
  const { word_list: list = [], active_time = '' } = data

  const rawRes = list.map((e: any, i: number) => `${i + 1}. ${e?.word}`).join('\n')

  return type === 'json'
    ? wrapperBaseRes(
        list.map((e: any) => ({
          word: e?.word,
          // word_cover: e?.word_cover,
          url: e?.word_cover?.url,
          cover: e?.word_cover?.url_list[0],
          event_time: e?.event_time,
          hot_value: e?.hot_value,
          label: e?.label,
          position: e?.position,
          word_type: e?.word_type,
          active_time,
        })),
      )
    : rawRes
}
