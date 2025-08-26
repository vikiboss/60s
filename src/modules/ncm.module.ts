import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

class ServiceNcm {
    private cache = new Map<string, { data: any; timestamp: number }>()
    private readonly CACHE_DURATION = 30 * 60 * 1000

    handleToplist(): RouterMiddleware<'/ncm-toplist'> {
        return async (ctx) => {
            const data = await this.#fetchToplist()

            switch (ctx.state.encoding) {
                case 'text':
                    ctx.response.body = `网易云音乐榜单列表\n\n${data
                        .map((e, i) => `${i + 1}. ${e.name} (ID: ${e.id})${e.description ? ' - ' + e.description : ''}`)
                        .join('\n')}`
                    break

                case 'json':
                default:
                    ctx.response.body = Common.buildJson(data)
                    break
            }
        }
    }

    handleToplistDetail(): RouterMiddleware<'/ncm-toplist/:id'> {
        return async (ctx) => {
            const id = ctx.params?.id || '3778678'
            const data = await this.#fetchPlaylist(id)

            switch (ctx.state.encoding) {
                case 'text':
                    ctx.response.body = `网易云音乐歌单\n\n${data
                        .map((e, i) => `${i + 1}. ${e.title} - ${e.artist} [${e.duration}]`)
                        .join('\n')}`
                    break

                case 'json':
                default:
                    ctx.response.body = Common.buildJson(data)
                    break
            }
        }
    }

    async #fetchToplist() {
        const cacheKey = 'toplist'
        const cached = this.cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data
        }

        const api = 'https://music.163.com/api/toplist'
        const options = {
            headers: {
                'User-Agent': Common.chromeUA,
                'Referer': 'https://music.163.com/'
            }
        }

        const response = await fetch(api, options)
        const { list = [] } = await response.json()

        const processedData = (list).map((toplist) => ({
            id: toplist.id,
            name: toplist.name,
            description: toplist.description,
            coverImgUrl: toplist.coverImgUrl,
            updateFrequency: toplist.updateFrequency, // 更新频率
            updateTime: toplist.updateTime,
            createTime: toplist.createTime,
            link: `https://music.163.com/#/discover/toplist?id=${toplist.id}`
        }))

        if (processedData.length > 0) {
            this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() })
        }

        return processedData
    }

    async #fetchPlaylist(id: string) {
        const cached = this.cache.get(id)
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data
        }

        const api = `https://music.163.com/api/playlist/detail?id=${id}`
        const options = {
            headers: {
                'User-Agent': Common.chromeUA,
                'Referer': 'https://music.163.com/'
            }
        }

        const response = await fetch(api, options)
        const { result = {}, msg } = await response.json()

        const processedData = ((result?.tracks || [])).slice(0, 50).map((track, index) => ({
            rank: index + 1, // 歌曲排名
            id: track.id,
            title: track.name,
            artist: track.artists?.map(artist => artist.name).join('/') || '未知艺术家',
            album: {
                id: track.album?.id || 0,
                name: track.album?.name || '未知专辑',
                cover: track.album?.picUrl || track.album?.blurPicUrl || '',
                publishTime: track.album?.publishTime || 0, // 专辑发行时间戳
                company: track.album?.company || '' // 发行公司
            },
            duration: this.#formatDuration(track.duration), // 格式化后的歌曲时长（分:秒）
            popularity: track.popularity || 0, // 歌曲热度值
            score: track.score || 0, // 歌曲评分
            fee: track.fee, // 收费类型：0免费，1VIP，4购买专辑，8非会员可播放低音质
            status: track.status,
            mb: { // 音质信息
                sq: track.sqMusic ? { // 无损音质
                    size: Math.round(track.sqMusic.size / 1024 / 1024 * 100) / 100, // 文件大小（MB）
                    bitrate: track.sqMusic.bitrate,
                    extension: track.sqMusic.extension
                } : null,
                hq: track.hMusic ? { // 高品质音质
                    size: Math.round(track.hMusic.size / 1024 / 1024 * 100) / 100,
                    bitrate: track.hMusic.bitrate,
                    extension: track.hMusic.extension
                } : null,
                mq: track.mMusic ? { // 标准音质
                    size: Math.round(track.mMusic.size / 1024 / 1024 * 100) / 100,
                    bitrate: track.mMusic.bitrate,
                    extension: track.mMusic.extension
                } : null,
                lq: track.lMusic ? { // 低音质
                    size: Math.round(track.lMusic.size / 1024 / 1024 * 100) / 100,
                    bitrate: track.lMusic.bitrate,
                    extension: track.lMusic.extension
                } : null
            },
            link: `https://music.163.com/#/song?id=${track.id}` // 歌曲链接
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