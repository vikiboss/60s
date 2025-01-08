import { Common } from '../common'

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
              const date = Common.localeTime(new Date(e.free_start_at).getTime(), {
                seconds: false,
              })
              const endDate = Common.localeTime(new Date(e.free_end_at).getTime(), {
                seconds: false,
              })
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
    const data = (await (await fetch(Common.useProxiedUrl(this.#API))).json()) || {}

    const allGames = (data?.data?.Catalog?.searchStore?.elements || []) as GameItem[]
    const activeGames = allGames.filter(e => this.#isPass7DaysAgo(e.effectiveDate))

    return activeGames.map(e => {
      const slug =
        e.productSlug ||
        e.catalogNs?.mappings?.[0]?.pageSlug ||
        e.offerMappings?.[0]?.pageSlug ||
        e.urlSlug ||
        ''

      const promotion =
        e.promotions?.promotionalOffers || e.promotions?.upcomingPromotionalOffers || []
      const promotionEnd = promotion[0]?.promotionalOffers?.[0]?.endDate

      const normalEndAt = promotionEnd
        ? new Date(promotionEnd).getTime()
        : new Date(e.effectiveDate).getTime() + 7 * 24 * 60 * 60 * 1000

      return {
        id: e.id || '',
        title: e.title || '',
        price: (e.price.totalPrice.originalPrice || 0) / 100,
        cover: e.keyImages?.[0]?.url || '',
        description: e.description || '',
        seller: e?.seller?.name || 'Unknown',
        is_free_now: !e.price.totalPrice.originalPrice,
        viewable_at: new Date(e.viewableDate).getTime(),
        free_start_at: new Date(e.effectiveDate).getTime(),
        free_end_at: e.expiryDate ? new Date(e.expiryDate).getTime() : normalEndAt,
        link: slug ? `https://store.epicgames.com/store/zh-CN/p/${slug}` : '',
      }
    })
  }

  #isPass7DaysAgo(date: string) {
    return new Date(date).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
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
