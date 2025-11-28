import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

interface QuarkImage {
  url: string
  width: number
  height: number
  type: string
  description?: string
}

interface QuarkArticle {
  id: string
  title: string
  summary: string
  content: string
  source_name: string
  origin_src_name: string
  publish_time: number
  grab_time: number
  modify_time: number
  thumbnails: {
    url: string
    width: number
    height: number
    type: string
  }[]
  images: {
    url: string
    width: number
    height: number
    type: string
    description?: string
  }[]
  videos: {
    url: string
    length: number
    poster?: {
      url: string
      width: number
      height: number
    }
  }[]
  category: string[]
  tags: string[]
  cmt_cnt: number
  article_like_cnt: number
  share_cnt: number
  fav_cnt: number
  original_url: string
  wm_author?: {
    name: string
    desc: string
    author_icon?: {
      url: string
    }
    follower_cnt: number
  }
  item_agg_info?: {
    item_index: number
  }
}

interface QuarkHotItem {
  id: string
  title: string
  summary: string
  content: string
  source: string
  published: string
  published_at: number
  cover: string
  images: QuarkImage[]
  category: string[]
  tags: string[]
  like_count: number
  share_count: number
  comment_count: number
  link: string
}

class ServiceQuark {
  handle(): RouterMiddleware<'/quark'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `夸克热点\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}${e.summary ? `\n   ${e.summary}` : ''}`)
            .join('\n\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 夸克热点\n\n${data
            .slice(0, 20)
            .map(
              (e, i) =>
                `### ${i + 1}. ${e.title}\n\n${e.summary ? `> ${e.summary}\n\n` : ''}${e.cover ? `![${e.title}](${e.cover})\n\n` : ''}- 来源：${e.source}\n- 时间：${Common.localeTime(e.published)}\n- 分类：${e.category.join(' / ') || '未分类'}\n${e.tags.length > 0 ? `- 标签：${e.tags.join(', ')}\n` : ''}\n---\n`,
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

  async #fetch(): Promise<QuarkHotItem[]> {
    const api =
      'https://iflow.quark.cn/iflow/api/v1/article/aggregation?aggregation_id=16665090098771297825&count=50&bottom_pos=0'

    const response = await fetch(api, {
      headers: {
        'User-Agent': Common.chromeUA,
      },
    })

    const json = await response.json()
    const articles: QuarkArticle[] = json?.data?.articles || []

    return articles.map((article) => {
      // 清理 HTML 标签，提取纯文本内容
      const cleanContent = this.#cleanHtml(article.content || '')

      // 处理图片列表
      const images: QuarkImage[] = (article.images || []).map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        type: img.type || 'jpg',
        description: img.description || undefined,
      }))

      return {
        id: article.id,
        title: article.title,
        summary: (article.summary || '').replace(/[，；,;。]?(查看)?((更多)|(详情))(>>)?/, '。').replace(/>>/, '。'),
        content: cleanContent,
        source: article.source_name,
        cover: article.thumbnails?.[0]?.url || article.images?.[0]?.url || '',
        images,
        category: article.category || [],
        tags: article.tags || [],
        like_count: article.article_like_cnt || 0,
        share_count: article.share_cnt || 0,
        comment_count: article.cmt_cnt || 0,
        published: Common.localeTime(article.publish_time),
        published_at: article.publish_time,
        link: `https://123.quark.cn/detail?item_id=${article.id}`,
      }
    })
  }

  /**
   * 清理 HTML 标签，提取纯文本内容
   */
  #cleanHtml(html: string): string {
    if (!html) return ''

    return (
      html
        // 移除图片/视频占位符
        .replace(/<!--\{(img|video):\d+\}-->/g, '')
        // 移除 HTML 标签
        .replace(/<[^>]+>/g, '')
        // 处理 HTML 实体
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        // 清理多余空白
        .replace(/\s+/g, ' ')
        .trim()
    )
  }
}

export const serviceQuark = new ServiceQuark()
