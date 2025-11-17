import { Common, dayjs } from '../common.ts'
import { filesize } from 'filesize'
import type { RouterMiddleware } from '@oak/oak'

class ServiceNcm {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  handleRank(): RouterMiddleware<'/ncm-rank'> {
    return async (ctx) => {
      const data = await this.#fetchRank()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `网易云音乐榜单\n\n${data
            .map((e, i) => `${i + 1}. ${e.name} (${e.update_frequency})`)
            .slice(0, 20)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 网易云音乐榜单\n\n${data
            .slice(0, 20)
            .map(
              (e, i) =>
                `### ${i + 1}. [${e.name}](${e.link}) \`${e.update_frequency}\`\n\n${e.description ? `${e.description}\n\n` : ''}${e.cover ? `![${e.name}](${e.cover})\n\n` : ''}**更新时间**: ${e.updated}\n\n---\n`,
            )
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  handleRankDetail(): RouterMiddleware<'/ncm-rank/:id'> {
    return async (ctx) => {
      const id = ctx.params?.id || '3778678' // 默认热歌榜
      const size = +(ctx.request.url.searchParams.get('size') || '36')
      const data = await this.#fetchPlaylist(id)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `网易云音乐${data?.[0]?.rank_name ?? ''}\n\n${data
            .slice(0, size)
            .map(
              (e, i) =>
                `${i + 1}. ${e.title} - ${e.artist
                  .slice(0, 2)
                  .map((e) => e.name)
                  .join('、')}`,
            )
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 网易云音乐${data?.[0]?.rank_name ?? ''}\n\n${data
            .slice(0, size)
            .map(
              (e, i) =>
                `### ${i + 1}. [${e.title}](${e.link}) \`${e.duration_desc}\`\n\n**歌手**: ${e.artist
                  .slice(0, 3)
                  .map((a) => `[${a.name}](${a.link})`)
                  .join(' / ')}\n\n**专辑**: ${e.album.name}${e.album.cover ? `\n\n![${e.album.name}](${e.album.cover})` : ''}\n\n**热度**: ${e.popularity} | **评分**: ${e.score}\n\n---\n`,
            )
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetchRank() {
    const cacheKey = 'toplist'
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as {
        id: number
        name: string
        description: string | null
        cover: string
        update_frequency: string
        updated: string
        updated_at: number
        created: string
        created_at: number
        link: string
      }[]
    }

    const api = 'https://music.163.com/api/toplist'
    const options = {
      headers: {
        'User-Agent': Common.chromeUA,
        Referer: 'https://music.163.com/',
      },
    }

    const response = await fetch(api, options)
    const { list = [] } = (await response.json()) as NcmRankRes

    const processedData = list.map((rank) => ({
      id: rank.id,
      name: rank.name,
      description: rank.description,
      cover: rank.coverImgUrl,
      update_frequency: rank.updateFrequency,
      updated: dayjs(rank.updateTime).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: rank.updateTime,
      created: dayjs(rank.createTime).format('YYYY-MM-DD HH:mm:ss'),
      created_at: rank.createTime,
      link: `https://music.163.com/#/discover/toplist?id=${rank.id}`,
    }))

    if (processedData.length > 0) {
      this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() })
    }

    return processedData
  }

  async #fetchPlaylist(id: string) {
    const cached = this.cache.get(id)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as {
        id: number
        rank: number
        rank_name: string
        title: string
        artist: {
          id: number
          name: string
          cover: string
          link: string
        }[]
        album: {
          id: number
          name: string
          cover: string
          published: string
          published_at: number
          company: string
        }
        duration: number
        duration_desc: string
        popularity: number
        score: number
        fee: number
        status: number
        mb: {
          sq: {
            size: number
            size_desc: string
            bitrate: number
            extension: string
          } | null
          hq: {
            size: number
            size_desc: string
            bitrate: number
            extension: string
          } | null
          mq: {
            size: number
            size_desc: string
            bitrate: number
            extension: string
          } | null
          lq: {
            size: number
            size_desc: string
            bitrate: number
            extension: string
          } | null
        }
        link: string
      }[]
    }

    const api = `https://music.163.com/api/playlist/detail?id=${id}`
    const options = {
      headers: {
        'User-Agent': Common.chromeUA,
        Referer: 'https://music.163.com/',
      },
    }

    const response = await fetch(api, options)
    const { result } = ((await response.json()) || {}) as NcmRankItemRes

    const processedData = (result?.tracks || []).map((track, index) => ({
      id: track.id,
      rank: index + 1,
      rank_name: result.name,
      title: track.name,
      artist: track.artists.map((e) => ({
        id: e.id,
        name: e.name,
        cover: e.picUrl || '',
        link: `https://music.163.com/#/artist?id=${e.id}`,
      })),
      album: {
        id: track.album?.id || 0,
        name: track.album?.name || '未知专辑',
        cover: track.album?.picUrl || track.album?.blurPicUrl || '',
        published: track.album?.publishTime ? dayjs(track.album?.publishTime).format('YYYY-MM-DD') : '未知日期', // 专辑发行时间
        published_at: track.album?.publishTime || 0,
        company: track.album?.company || '',
      },
      duration: track.duration,
      duration_desc: this.#formatDuration(track.duration),
      popularity: track.popularity || 0,
      score: track.score || 0,
      fee: track.fee,
      status: track.status,
      mb: {
        sq: track.sqMusic
          ? {
              size: track.sqMusic.size,
              size_desc: filesize(track.sqMusic.size),
              bitrate: track.sqMusic.bitrate,
              extension: track.sqMusic.extension,
            }
          : null,
        hq: track.hMusic
          ? {
              size: track.hMusic.size,
              size_desc: filesize(track.hMusic.size),
              bitrate: track.hMusic.bitrate,
              extension: track.hMusic.extension,
            }
          : null,
        mq: track.mMusic
          ? {
              size: track.mMusic.size,
              size_desc: filesize(track.mMusic.size),
              bitrate: track.mMusic.bitrate,
              extension: track.mMusic.extension,
            }
          : null,
        lq: track.lMusic
          ? {
              size: track.lMusic.size,
              size_desc: filesize(track.lMusic.size),
              bitrate: track.lMusic.bitrate,
              extension: track.lMusic.extension,
            }
          : null,
      },
      link: `https://music.163.com/#/song?id=${track.id}`, // 歌曲链接
    }))

    if (processedData.length > 0) {
      this.cache.set(id, { data: processedData, timestamp: Date.now() })
    }

    return processedData
  }

  #formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

export const serviceNcm = new ServiceNcm()

export interface NcmRankRes {
  code: number
  list: {
    subscribers: any[]
    subscribed: null
    creator: null
    artists: null
    tracks: null
    updateFrequency: string
    backgroundCoverId: number
    backgroundCoverUrl: null
    titleImage: number
    coverText: null
    titleImageUrl: null
    coverImageUrl: null
    iconImageUrl: null
    englishTitle: null
    opRecommend: boolean
    recommendInfo: null
    socialPlaylistCover: null
    tsSongCount: number
    algType: null
    originalCoverId: number
    topTrackIds: null
    playlistType: string
    uiPlaylistType: null
    specialType: number
    cloudTrackCount: number
    coverImgId: number
    newImported: boolean
    anonimous: boolean
    updateTime: number
    coverImgUrl: string
    trackCount: number
    commentThreadId: string
    trackUpdateTime: number
    totalDuration: number
    playCount: number
    subscribedCount: number
    highQuality: boolean
    trackNumberUpdateTime: number
    privacy: number
    adType: number
    createTime: number
    ordered: boolean
    description: string | null
    status: number
    tags: string[]
    userId: number
    name: string
    id: number
    coverImgId_str: string
    ToplistType?: string
  }[]
  artistToplist: {
    coverUrl: string
    name: string
    upateFrequency: string
    position: number
    updateFrequency: string
  }
}

export interface NcmRankItemRes {
  result: {
    subscribers: any[]
    subscribed: boolean
    creator: {
      defaultAvatar: boolean
      province: number
      authStatus: number
      followed: boolean
      avatarUrl: string
      accountStatus: number
      gender: number
      city: number
      birthday: number
      userId: number
      userType: number
      nickname: string
      signature: string
      description: string
      detailDescription: string
      avatarImgId: number
      backgroundImgId: number
      backgroundUrl: string
      authority: number
      mutual: boolean
      expertTags: null
      experts: null
      djStatus: number
      vipType: number
      remarkName: null
      authenticationTypes: number
      avatarDetail: null
      avatarImgIdStr: string
      backgroundImgIdStr: string
      anchor: boolean
    }
    artists: null
    tracks: {
      name: string
      id: number
      position: number
      alias: any[]
      status: number
      fee: number
      copyrightId: number
      disc: string
      no: number
      artists: Array<{
        name: string
        id: number
        picId: number
        img1v1Id: number
        briefDesc: string
        picUrl: string
        img1v1Url: string
        albumSize: number
        alias: any[]
        trans: string
        musicSize: number
        topicPerson: number
      }>
      album: {
        name: string
        id: number
        type: string
        size: number
        picId: number
        blurPicUrl: string
        companyId: number
        pic: number
        picUrl: string
        publishTime: number
        description: string
        tags: string
        company: string
        briefDesc: string
        artist: {
          name: string
          id: number
          picId: number
          img1v1Id: number
          briefDesc: string
          picUrl: string
          img1v1Url: string
          albumSize: number
          alias: any[]
          trans: string
          musicSize: number
          topicPerson: number
        }
        songs: any[]
        alias: any[]
        status: number
        copyrightId: number
        commentThreadId: string
        artists: Array<{
          name: string
          id: number
          picId: number
          img1v1Id: number
          briefDesc: string
          picUrl: string
          img1v1Url: string
          albumSize: number
          alias: any[]
          trans: string
          musicSize: number
          topicPerson: number
        }>
        subType: string
        transName: null
        onSale: boolean
        mark: number
        gapless: number
        dolbyMark: number
        picId_str: string
      }
      starred: boolean
      popularity: number
      score: number
      starredNum: number
      duration: number
      playedNum: number
      dayPlays: number
      hearTime: number
      sqMusic: {
        name: null
        id: number
        size: number
        extension: string
        sr: number
        dfsId: number
        bitrate: number
        playTime: number
        volumeDelta: number
      }
      hrMusic: null
      ringtone: string
      crbt: null
      audition: null
      copyFrom: string
      commentThreadId: string
      rtUrl: null
      ftype: number
      rtUrls: any[]
      copyright: number
      transName: null
      sign: null
      mark: number
      originCoverType: number
      originSongSimpleData: null
      single: number
      noCopyrightRcmd: null
      bMusic: {
        name: null
        id: number
        size: number
        extension: string
        sr: number
        dfsId: number
        bitrate: number
        playTime: number
        volumeDelta: number
      }
      hMusic: {
        name: null
        id: number
        size: number
        extension: string
        sr: number
        dfsId: number
        bitrate: number
        playTime: number
        volumeDelta: number
      }
      mMusic: {
        name: null
        id: number
        size: number
        extension: string
        sr: number
        dfsId: number
        bitrate: number
        playTime: number
        volumeDelta: number
      }
      lMusic: {
        name: null
        id: number
        size: number
        extension: string
        sr: number
        dfsId: number
        bitrate: number
        playTime: number
        volumeDelta: number
      }
      mp3Url: null
      rtype: number
      rurl: null
      mvid: number
    }[]
    updateFrequency: null
    backgroundCoverId: number
    backgroundCoverUrl: null
    titleImage: number
    coverText: null
    titleImageUrl: null
    coverImageUrl: null
    iconImageUrl: null
    englishTitle: null
    opRecommend: boolean
    recommendInfo: null
    socialPlaylistCover: null
    tsSongCount: number
    algType: null
    originalCoverId: number
    topTrackIds: null
    playlistType: string
    uiPlaylistType: null
    highQuality: boolean
    specialType: number
    coverImgId: number
    newImported: boolean
    anonimous: boolean
    updateTime: number
    coverImgUrl: string
    trackCount: number
    commentThreadId: string
    trackUpdateTime: number
    totalDuration: number
    playCount: number
    trackNumberUpdateTime: number
    privacy: number
    adType: number
    subscribedCount: number
    cloudTrackCount: number
    createTime: number
    ordered: boolean
    description: null
    status: number
    tags: any[]
    userId: number
    name: string
    id: number
    shareCount: number
    commentCount: number
  }
  code: number
}
