import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceLyric {
  handle(): RouterMiddleware<'/lyric'> {
    return async (ctx) => {
      const query = ctx.request.url.searchParams.get('query')

      if (!query) {
        return Common.requireArguments('query', ctx)
      }

      const clean = ctx.request.url.searchParams.get('clean') !== 'false'

      const data = await this.#fetchLyric(query, clean)

      if (!data) {
        ctx.response.status = 404
        ctx.response.body = Common.buildJson(null, 404, '未找到歌曲或歌词')
        return
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.formatted
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetchLyric(query: string, clean = false) {
    const options = { headers: { 'User-Agent': Common.chromeUA, Referer: 'https://y.qq.com/' } }

    // 第一步: 搜索歌曲获取 songmid
    const searchApi = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?format=json&p=1&n=1&w=${encodeURIComponent(query)}`
    const searchRes = await fetch(searchApi, options)
    const searchData = (await searchRes.json()) as QQMusicSearchRes

    if (!searchData?.data?.song?.list?.length) return null

    const song = searchData.data.song.list[0]
    const songmid = song.songmid
    const title = song.songname
    const artists = song.singer.map((s) => s.name)
    const album = song.albumname

    // 第二步: 获取歌词
    const lyricApi = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?format=json&nobase64=1&type=1&songmid=${songmid}`
    const lyricRes = await fetch(lyricApi, options)
    const lyricData = (await lyricRes.json()) as QQMusicLyricRes

    if (!lyricData?.lyric) return null

    const raw_lyric = lyricData.lyric
    const offset = +(raw_lyric.match(/\[offset:(-?\d+)\]/)?.[1] || 0)
    const lyrics = this.#parseLyric(raw_lyric, clean)
    const formatted = this.#cleanLyric(raw_lyric, clean)

    const result = {
      title,
      artists,
      album,
      offset,
      lyrics,
      formatted,
      raw_lyric,
    }

    return result
  }

  #parseLyric(lyric: string, cleanInfo = true): Array<{ ms: number; time: string; label: string; lyric: string }> {
    const lines = lyric.split('\n')
    const result: Array<{ ms: number; time: string; label: string; lyric: string }> = []

    // 时间戳正则: [mm:ss.cs] 或 [mm:ss] (cs 是百分秒/厘秒,两位数)
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

    for (const line of lines) {
      // 跳过元数据行 (如 [ti:], [ar:], [al:] 等)
      if (line.match(/^\[[a-z]+:/i)) {
        continue
      }

      const matches = [...line.matchAll(timeRegex)]
      if (matches.length === 0) {
        continue
      }

      // 提取歌词内容 (去除所有时间戳)
      const lyricText = line.replace(timeRegex, '').trim()

      // 如果启用 cleaned 参数,过滤歌曲信息行
      if (cleanInfo && lyricText && this.#isInfoLine(lyricText)) {
        continue
      }

      // 一行可能有多个时间戳
      // 保留空字符串,表示间奏或空白时间点
      for (const match of matches) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0

        const ms = minutes * 60 * 1000 + seconds * 1000 + milliseconds

        result.push({
          ms,
          time: this.#formatTime(ms),
          label: this.#formatLabel(ms),
          lyric: lyricText, // 可能为空字符串,表示间奏
        })
      }
    }

    // 按时间戳排序
    return result.toSorted((a, b) => a.ms - b.ms)
  }

  #formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  #formatLabel(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10) // 百分位秒 (厘秒, 两位)

    return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}]`
  }

  #isInfoLine(text: string): boolean {
    if (!text.trim()) return false

    return (
      // 中文标签: "词:" "曲:" "编曲:" 等,包含混合格式如 "词 Lyricist:"
      /^(词|曲|编曲|作词|作曲|演唱|歌手|专辑|制作人|混音|和声|吉他|低音吉他|键盘|键盘乐器|贝斯|鼓|监制|出品|发行|口哨|录音室|录音工程师|混音工程师|混音录音室|母带后期处理工程师|制作协力|版权声明|出品方|发行方|后期|制作)(?:[：:\s(]|\s+[A-Za-z][A-Za-z\s&/()]*[：:\s])/.test(
        text,
      ) ||
      // 英文标签: "Written by:" "Producer:" "Lyricist:" 等
      /^(Written|Composed|Lyrics|Music|Arranged|Producer|Artist|Album|Lyricist|Composer|Vocal|Guitar|Bass|Drums|Keyboards|Whistle|Engineer|Studio|Assistant|Mastering|Recording|Mixing|Rhodes|Mellotron|Synthesizer|Piano|Violin|Trumpet|Saxophone|Flute|Production|Executive|Director|Sound|Background)(?:\s+by)?[：:\s/]/i.test(
        text,
      ) ||
      // 版权声明
      /^(版权|著作权|Copyright|未经著作权人|任何人不得|不得|翻唱|翻录|盗版|侵权|All Rights|Reserved|\(C\)|\(P\)|©|℗)/i.test(
        text,
      ) ||
      // 包含 "by" 的行
      /\s+by[：:\s]/i.test(text) ||
      // 其他格式
      /^(op|ed|cv|ft|feat)[：:\s]/i.test(text) ||
      // 括号包裹的补充信息
      /^[(（].*[)）]$/.test(text)
    )
  }

  #cleanLyric(lyric: string, cleanInfo = true): string {
    // 元数据行正则 (预编译避免重复创建)
    const metadataRegex = /^\[[a-z]+:/i
    // 时间戳正则
    const timestampRegex = /\[\d{2}:\d{2}(?:[\.:]\d{2,3})?\]/g

    return lyric
      .split('\n')
      .reduce<string[]>((result, line) => {
        // 跳过元数据行
        if (metadataRegex.test(line)) {
          return result
        }

        // 移除时间戳并清理空白
        const cleaned = line.replace(timestampRegex, '').trim()

        // 跳过空行和信息行
        if (!cleaned || (cleanInfo && this.#isInfoLine(cleaned))) {
          return result
        }

        result.push(cleaned)
        return result
      }, [])
      .join('\n')
  }
}

export const serviceLyric = new ServiceLyric()

interface QQMusicSearchRes {
  code: number
  data: {
    keyword: string
    priority: number
    qc: any[]
    semantic: {
      curnum: number
      curpage: number
      list: any[]
      totalnum: number
    }
    song: {
      curnum: number
      curpage: number
      list: {
        songmid: string
        songname: string
        singer: {
          id: number
          mid: string
          name: string
        }[]
        albumname: string
        albummid: string
        albumid: number
      }[]
      totalnum: number
    }
  }
}

interface QQMusicLyricRes {
  code: number
  lyric: string
  retcode: number
  subcode: number
  trans: string
}
