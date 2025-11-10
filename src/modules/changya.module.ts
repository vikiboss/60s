import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceChangYa {
  handle(): RouterMiddleware<'/changya'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.audio.url
          break

        case 'markdown':
          ctx.response.body = `# 🎤 唱鸭随机作品\n\n## ${data.song.name}\n\n**演唱**: ${data.user.nickname} ${data.user.gender === 'M' ? '♂' : '♀'}\n\n**原唱**: ${data.song.singer}\n\n**时长**: ${Math.floor(data.audio.duration / 60)}:${(data.audio.duration % 60).toString().padStart(2, '0')}\n\n**发布时间**: ${data.audio.publish}\n\n**点赞数**: ${data.audio.like_count}\n\n[🔗 在线收听](${data.audio.link}) | [🎵 音频链接](${data.audio.url})\n\n---\n\n### 歌词\n\n${data.song.lyrics.slice(0, 6).join('\n')}\n\n*...*`
          break

        case 'audio':
          ctx.response.redirect(data.audio.url)
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const seedIdList = [
      '7o62vihNpccBDyDPv',
      '7onVzoWsr2m12T3Jn',
      '9o73vLjV8gBVXsaTK',
      'bop2h0lm9HqkTZk5l',
      'foh3CeIN82Vq2V1g8',
      'fop3CRU0CDDRVZyRv',
      'Io82fiEPMZXca3L2h',
      'jov3lixipX1myTZJ8',
      'Ko-3CFC4SwwgPVkad',
      'Koj3bFjg9iTHHFVwp',
      'OoC38kEclV2PHPw08',
      'QoM37qUJxRJg5ZR5U',
      'roz2SJYV8oy0sNHPl',
      'SoO36F74v12acJg5z',
      'SoQJ9cKu61FJ1Vwc7',
      'Soz3xRz1f230H3ws6',
      'toGZlBfZbukck2sHb',
      'WoENz0IiQVX1PLJs7',
    ]

    const randomId = Common.randomItem(seedIdList)
    const url = `https://m.api.singduck.cn/user-piece/${randomId}`
    const data = await (await fetch(url)).text()

    if (!data) throw new Error('fetch data error')

    const start = '<script id="__NEXT_DATA__" type="application/json" crossorigin="anonymous">'
    const end = '</script>'

    const pageData = JSON.parse(mid(data, start, end))

    return Common.randomItem(
      (pageData.props.pageProps.pieces as Item[]).map((item) => {
        const audioUrl = item.originAudioUrl || item.audioUrl || item.recordUrl

        return {
          user: {
            nickname: item.nickname,
            gender: item.gender,
            avatar_url: item.user.avatarUrl,
          },
          song: {
            name: item.songName,
            singer: item.artist,
            lyrics: item.lyric.split('\n').map((e) => e.trim()),
          },
          audio: {
            url: audioUrl ? decodeURIComponent(audioUrl) : '',
            duration: item.audioDuration,
            like_count: item.likeCount,
            link: `https://m.api.singduck.cn/user-piece/${item.ugcId}`,
            publish: Common.localeTime(new Date(item.publishTime)),
            publish_at: new Date(item.publishTime).getTime(),
          },
        }
      }),
    )

    function mid(str: string, start: string, end: string, greed = false) {
      const front = str.indexOf(start)
      const back = greed ? str.lastIndexOf(end) : str.indexOf(end, front)
      if (front === -1 || back === -1 || front + start.length >= back) return ''
      return str.slice(front + start.length, back)
    }
  }
}

export const serviceChangYa = new ServiceChangYa()

interface Item {
  aiLyrics: boolean
  aiOrigin: boolean
  aiPrompts: null
  aiSameCnt: null
  aiSameEnabled: boolean
  article: null
  artist: string
  audioCount: number
  audioDesc: string | null
  audioDuration: number
  audioFilterType: string
  audioId: string
  audioUrl: string
  avatarUrl: string
  backgroundUrl: string
  beat: null
  canDownload: boolean
  canEnsemble: number
  canRecord: null
  canSameTune: boolean
  chord: string
  clipGenre: number
  clipType: number
  commentCount: number
  cursor: string
  displayText: null
  effect: null | string
  ensembleCount: number
  ensembleUgc: null
  extend_data: {
    checked_exploreable?: number
    total_audio: number
    chord_id: string
    tpc: number
    review_result: number
    chord_tone?: string
    is_exploreable: number
    machine_check_exploreable: number
    leading_total_audio: number
    enableChordPlayback: number
    reason_explorable?: string
    use_sound_effect: number
    tagList: Array<{
      clickUrl: string
      iconUrl: string
      id: string
      title: string
    }>
    rpcl: number
    lyric_rhythm_version?: string
    chord_status: number
    chord: Array<{
      note: string
      number: number
      range: number[]
      show_note: string
    }>
    lyric_rhythm?: {
      result: Array<{
        continous_num: number
        rhyme_num: number
        rule: string[]
        coords: Array<{
          col_index: number[]
          row_index: number[]
          word: string[]
        }>
      }>
      sentences: Array<string[]>
    }
    userChord: null
    detectBPMData?: string
    play_status: number
    audio_attributes: {
      volume: {
        accompanimentVoice: string[]
        personVoice: string[]
        vocalVoice?: string[]
        effectVoice?: string[]
        ensembleVoice?: any[]
        drumVoice?: any[]
        ensembleChordVoice?: any[]
        originalAudioVoice?: any[]
        ensembleVocalVoice?: any[]
        ensembleBeatVoice?: any[]
      }
      volumeBalance: number
      vocalDoubling: number
      micPortType: string
      sysCurVolume?: string
      superMix?: number
      sysMaxVolume?: string
      beddingTrackFlags?: number
      ensembleType?: number
      beddingTrackLatency?: number
    }
    xn_review_result?: number
    is_private_play?: number
    accompaniment_volume?: number
    origin_chord_id?: string
    accompaniment_active_score?: number
    ai_score_version?: string
    beats_score?: number
    vocal_active_score?: number
    accompaniment_vocal_active_score_version?: string
    forbid_gen_video?: number
    vocal_volume?: number
    ai_score?: number
    is_original_singing?: number
    useRecommendBPMTips?: number
    harms_score?: number
    pitch_score?: number
    effect_record?: {
      effect_use_record: Array<{
        g_id: string
        n_id: string
      }>
      melody_use_record: any[]
      effect_instrument_cnt: number
      melody_instrument_cnt: number
    }
  }
  favorited: number
  forbidGenVideo: number
  gender: string
  hasFollowed: boolean
  hotValue: number
  hotValueStr: string
  ipAddressInfo: null
  leadUgc: null
  likeCount: number
  likeStatus: number
  lyric: string
  mp3Size: number
  nickname: string
  noteSongDto: null
  ntmIconEnabled: boolean
  ntmTaskType: null
  oriUgcItemId: null
  originAudioUrl: string
  originOssId: string
  originalClipType: number
  originalSing: number
  ossId: string
  parentAudioId: string
  personalDataType: number
  playCount: number
  playlistId: string
  privacy: number
  promptTemplate: null
  publishTime: string
  publishTimeL: null
  quotaId: number
  rankNo: number
  rapText: null
  rapUgcCount: number
  recordUgcList: null
  recorded: null
  resUseHsfVo: null
  sceneType: number
  segmentAuthor: null
  segmentDuration: number
  segmentId: string
  segmentReviewResult: number
  showPlayCount: boolean
  singerInfo: null
  singerUcid: null
  songName: string
  stickyPersonalPage: null
  syncRate: number
  t2mAiUgc: boolean
  t2mItemId: null
  t2mVedio: null
  topRankNo: number
  topic_info: {
    audioDescWithTopic: string | null
    topicIds: string[] | null
  }
  ugcStatus: number
  ugcType: number
  user: {
    auths: null
    avatarFrameId: number
    avatarFrameUrl: string
    avatarUrl: string
    backgroundUrl: string
    capabilityCert: {
      authDesc: string
      authLogoUrl: string
      authType: number
    } | null
    description: string | null
    expirationDate: null
    followStatus: number
    gender: string
    guildFacadeVo: {
      guildBaseInfo: {
        guildId: number
        name: string
      }
      guildLevelVo: {
        backPic: string
        borderColor: string | null
        colorDown: string
        colorTop: string
        guildStandard: string
        level: number
      }
      guildMemberInfo: {
        position: number
        userModule: string
      }
    } | null
    guildId: number | null
    memberLevel: number
    memberState: number
    memberYear: boolean
    nickname: string
    onlineState: boolean
    roomInfo: null
    ugcTipNo: null
    userId: string
    vipId: string
  }
  userId: string
  wavSize: number
  ugcId: string
  songname: string
  username: string
  recordUrl: string
}
