import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceLyric {
  handle(): RouterMiddleware<'/lyric'> {
    return async (ctx) => {
      const query = ctx.request.url.searchParams.get('query')

      if (!query) {
        return Common.requireArguments('query', ctx.response)
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

        case 'markdown':
          ctx.response.body = `# 🎵 ${data.title}\n\n**演唱**: ${data.artists.join(', ')}\n\n**专辑**: ${data.album}\n\n---\n\n${data.formatted}`
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
    const list = result.toSorted((a, b) => a.ms - b.ms)

    if (list[0] && list[0].lyric?.includes(' - ')) {
      list.shift() // 移除第一行的歌曲标题和艺术家信息
    }

    return list
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

  // 静态常量: 提取到类级别避免每次调用都创建
  static readonly #CHINESE_KEYWORDS = new Set([
    '词',
    '曲',
    '编曲',
    '作词',
    '作曲',
    '演唱',
    '歌手',
    '艺人',
    '专辑',
    '制作人',
    '制作',
    '监制',
    '监棚',
    '混音',
    '混音师',
    '和声',
    '和音',
    '合声',
    '配唱',
    '和声配唱',
    '合声编写',
    '人声',
    '主唱',
    '合唱',
    '伴唱',
    '吉他',
    '低音吉他',
    '电吉他',
    '木吉他',
    '民谣吉他',
    '古典吉他',
    '键盘',
    '键盘乐器',
    '贝斯',
    '贝司',
    '鼓',
    '架子鼓',
    '打击乐',
    '弦乐',
    '管弦乐',
    '提琴',
    '小提琴',
    '中提琴',
    '大提琴',
    '低音提琴',
    '萨克斯',
    '长笛',
    '短笛',
    '哨笛',
    '竖笛',
    '箫',
    '笛子',
    '埙',
    '葫芦丝',
    '唢呐',
    '小号',
    '大号',
    '圆号',
    '长号',
    '钢琴',
    '三角钢琴',
    '口琴',
    '手风琴',
    '口哨',
    '二胡',
    '琵琶',
    '古筝',
    '古琴',
    '扬琴',
    '琴',
    '筝',
    '箜篌',
    '马林巴',
    '出品',
    '发行',
    '录音',
    '录音师',
    '录音室',
    '录音棚',
    '录音工程师',
    '混音工程师',
    '混音录音室',
    '母带',
    '母带工程师',
    '母带后期',
    '母带后期处理工程师',
    '制作协力',
    '版权声明',
    '后期',
    '后期制作',
    '统筹',
    '项目统筹',
    '企划',
    '策划',
    '宣传',
    '推广',
    '特别鸣谢',
    '鸣谢',
    '感谢',
    '致谢',
    'OP',
    'SP',
  ])

  // 预编译的正则表达式: 避免每次调用都重新编译
  static readonly #PATTERNS = {
    chineseLabel: /^[\u4e00-\u9fa5/]{1,10}[：:\s]/,
    colonSeparator: /[：:\s]/,
    englishLabel:
      /^(Written|Composed|Lyrics|Music|Arranged|Arrangement|Producer|Co-Producer|Executive Producer|Artist|Album|Lyricist|Composer|Vocal|Vocals|Bvox|Backing Vocals|Chorus|Choir|Guitar|E\.Guitar|A\.Guitar|Classical Guitar|Bass|Drums|Keyboards|Piano|Grand Piano|Whistle|Harmonica|Accordion|Strings|Violin|Viola|Cello|Double Bass|Brass|Saxophone|Trumpet|Trombone|Flute|Piccolo|Clarinet|Oboe|Bassoon|Engineer|Sound Engineer|Studio|Recording Studio|Assistant|Mastering|Recording|Mixing|Mix|Rhodes|Mellotron|Synthesizer|Synth|Production|Executive|Director|Sound|Background|Percussion|Programming|Coordinator|Organizer|Thanks|Special Thanks|Acknowledgment|OP|SP|Label|Publisher|Release|Distributor)(?:\s+by)?[：:\s/]/i,
    instrumentAbbrev:
      /^[A-Z][\w.]*\s*(Guitar|Guita|Bass|Drums|Piano|Keyboard|Vocal|Vocals|Bvox|Violin|Viola|Cello|Trumpet|Trombone|Sax|Saxophone|Flute|Synth|Synthesizer|Percussion|Strings|Harmonic|Choir)[：:\s]/i,
    copyright:
      /^(版权|著作权|Copyright|未经著作权人|任何人不得|不得|翻唱|翻录|盗版|侵权|授权|许可|All Rights|Rights Reserved|Reserved|\(C\)|\(P\)|©|℗)/i,
    byClause: /\s+by[：:\s]/i,
    formatTag:
      /^(op|ed|cv|ft|feat|featuring|feat\.|sp|vs|vs\.|remix|mix|ver|version|live|acoustic|instrumental|demo|original|cover)[：:\s.]/i,
    sourceInfo: /^(出自|来自|选自|收录于|特别鸣谢|鸣谢|感谢|致谢|from|source|thanks|special thanks)[：:\s]/i,
    timeLocationInfo: /^(录制于|录于|制作于|发行于|recorded|produced|released|at|in|on)[：:\s]/i,
    urlOrEmail: /(https?:\/\/|www\.|\.com|\.cn|\.net|\.org|@[\w.]+[\s(]|Studio\(|工作室\()/i,
    yearInfo: /^\d{4}年?[\s\u4e00-\u9fa5]*$/,
    parentheses: /^[(（].*[)）]$/,
    separatorLine: /^[-=*_~]{3,}$/,
  } as const

  #isInfoLine(text: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false

    // 中文标签检测: 支持单字和组合词 (如 "词:" "弦乐监棚:" "出品发行:")
    if (ServiceLyric.#PATTERNS.chineseLabel.test(trimmed)) {
      const beforeColon = trimmed.split(ServiceLyric.#PATTERNS.colonSeparator)[0]
      // 使用 Set 的 O(1) 查找优化性能
      for (const keyword of ServiceLyric.#CHINESE_KEYWORDS) {
        if (beforeColon.includes(keyword)) return true
      }
    }

    // 其他模式匹配: 使用预编译的正则表达式提升性能
    const patterns = ServiceLyric.#PATTERNS
    return (
      patterns.englishLabel.test(trimmed) ||
      patterns.instrumentAbbrev.test(trimmed) ||
      patterns.copyright.test(trimmed) ||
      patterns.byClause.test(trimmed) ||
      patterns.formatTag.test(trimmed) ||
      patterns.sourceInfo.test(trimmed) ||
      patterns.timeLocationInfo.test(trimmed) ||
      patterns.urlOrEmail.test(trimmed) ||
      patterns.yearInfo.test(trimmed) ||
      patterns.parentheses.test(trimmed) ||
      patterns.separatorLine.test(trimmed)
    )
  }

  // 静态正则: 用于 cleanLyric 的模式匹配
  static readonly #CLEAN_PATTERNS = {
    metadata: /^\[[a-z]+:/i,
    timestamp: /\[\d{2}:\d{2}(?:[.:]\d{2,3})?\]/g,
  } as const

  #cleanLyric(lyric: string, cleanInfo = true): string {
    const patterns = ServiceLyric.#CLEAN_PATTERNS

    return lyric
      .split('\n')
      .reduce<string[]>((result, line) => {
        // 早期返回: 跳过元数据行 (如 [ti:], [ar:], [al:])
        if (patterns.metadata.test(line)) return result

        // 移除时间戳并清理空白
        const cleaned = line.replace(patterns.timestamp, '').trim()

        // 早期返回: 跳过空行和信息行
        if (!cleaned || (cleanInfo && this.#isInfoLine(cleaned))) return result

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
