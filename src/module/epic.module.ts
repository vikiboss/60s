import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceEpic {
  #API =
    'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN'

  handle(): RouterMiddleware<'/epic'> {
    return async ctx => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
            .slice(0, 20)
            .map((e, idx) => {
              const date = Common.localeTime(new Date(e.free_start_at), { seconds: false })
              const endDate = Common.localeTime(new Date(e.free_end_at), { seconds: false })
              return `${idx + 1}. 《${e.title}》，${
                e.is_free_now ? `现在免费，截至到 ${endDate}` : `于 ${date} 至 ${endDate} 免费`
              }\n\n${e.description}`
            })
            .join('\n\n')
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const data = ((await (await fetch(Common.useProxiedUrl(this.#API))).json()) || {}) as any

    const allGames = (data?.data?.Catalog?.searchStore?.elements || []) as GameItem[]
    const activeGames = allGames
      .filter(e => e.offerType === 'BASE_GAME' && e.promotions)
      .toSorted((a, b) => {
        return (
          (a.promotions?.upcomingPromotionalOffers?.length || 0) -
          (b.promotions?.upcomingPromotionalOffers?.length || 0)
        )
      })

    return activeGames.map(e => {
      const slug =
        e.productSlug ||
        e.catalogNs?.mappings?.[0]?.pageSlug ||
        e.offerMappings?.[0]?.pageSlug ||
        e.urlSlug ||
        ''

      const promotion = e.promotions?.upcomingPromotionalOffers.length
        ? e.promotions?.upcomingPromotionalOffers
        : e.promotions?.promotionalOffers || []

      const offer = promotion[0]?.promotionalOffers?.[0]
      const { startDate, endDate } = offer || {}

      const promotionStartAt = startDate ? new Date(startDate).getTime() : new Date('1970/1/1')
      const promotionEndAt = endDate ? new Date(endDate).getTime() : new Date('1970/1/1')

      return {
        id: e.id || '',
        title: e.title || '-',
        cover: e.keyImages?.[0]?.url || '',
        original_price: (e.price.totalPrice.originalPrice || 0) / 100 || 0,
        original_price_desc: e.price.totalPrice.fmtPrice.originalPrice || '暂无价格',
        description: e.description || '暂无描述',
        seller: e?.seller?.name || '未知发行商',
        is_free_now: !e.price.totalPrice.originalPrice,
        free_start: Common.localeTime(promotionStartAt),
        free_start_at: promotionStartAt,
        free_end: Common.localeTime(promotionEndAt),
        free_end_at: promotionEndAt,
        link: slug ? `https://store.epicgames.com/store/zh-CN/p/${slug}` : '',
      }
    })
  }
}

export const serviceEpic = new ServiceEpic()

interface GameItem {
  title: string
  id: string
  namespace: string
  description: string
  effectiveDate: string
  offerType: string
  expiryDate: null
  viewableDate: string
  status: string
  isCodeRedemptionOnly: boolean
  keyImages: { type: string; url: string }[]
  seller: { id: string; name: string }
  productSlug: null | string
  urlSlug: string
  url: null
  items: { id: string; namespace: string }[]
  customAttributes: { key: string; value: string }[]
  categories: { path: string }[]
  tags: { id: string }[]
  catalogNs: { mappings: { pageSlug: string; pageType: string }[] | null }
  offerMappings: { pageSlug: string; pageType: string }[] | null
  price: {
    totalPrice: {
      discountPrice: number
      originalPrice: number
      voucherDiscount: number
      discount: number
      currencyCode: string
      currencyInfo: { decimals: number }
      fmtPrice: {
        originalPrice: string
        discountPrice: string
        intermediatePrice: string
      }
    }
    lineOffers: {
      appliedRules: {
        id: string
        endDate: string
        discountSetting: { discountType: string }
      }[]
    }[]
  }
  promotions: null | {
    promotionalOffers: {
      promotionalOffers: {
        startDate: string
        endDate: string
        discountSetting: {
          discountType: string
          discountPercentage: number
        }
      }[]
    }[]
    upcomingPromotionalOffers: {
      promotionalOffers: {
        startDate: string
        endDate: string
        discountSetting: {
          discountType: string
          discountPercentage: number
        }
      }[]
    }[]
  }
}
