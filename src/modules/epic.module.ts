import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceEpic {
  handle(): RouterMiddleware<'/epic'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `Epic Games 免费游戏\n\n${data
            .slice(0, 20)
            .map((e, idx) => {
              const date = Common.localeTime(new Date(e.free_start_at), { seconds: false })
              const endDate = Common.localeTime(new Date(e.free_end_at), { seconds: false })
              const hasBookTitle = e.title.includes('《')
              const title = hasBookTitle ? e.title : `《${e.title}》`

              const freeDesc = e.is_free_now ? `现在免费，截至到 ${endDate}` : `于 ${date} 至 ${endDate} 免费`

              return `${idx + 1}. ${title}，${freeDesc}\n\n${e.description}`
            })
            .join('\n\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch() {
    const api =
      'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN'
    const data = ((await (await fetch(Common.useProxiedUrl(api))).json()) || {}) as any

    const allGames = (data?.data?.Catalog?.searchStore?.elements || []) as GameItem[]

    const activeGames = allGames
      .filter((e) => ['OTHERS', 'BASE_GAME'].some((type) => type === e.offerType) && !!getFreeOffer(e))
      .toSorted(
        (a, b) =>
          compareDate(getFreeOffer(a)?.startDate || '', getFreeOffer(b)?.startDate || '') ||
          a.title.localeCompare(b.title),
      )

    return activeGames.map((e) => {
      const slug =
        e.productSlug || e.catalogNs?.mappings?.[0]?.pageSlug || e.offerMappings?.[0]?.pageSlug || e.urlSlug || ''

      const offer = getFreeOffer(e)
      const { startDate, endDate } = offer || {}

      const promotionStartAt = startDate ? new Date(startDate).getTime() : new Date('1970/1/1')
      const promotionEndAt = endDate ? new Date(endDate).getTime() : new Date('1970/1/1')

      const originalCover = e.keyImages?.find((e) => e.type === 'OfferImageWide')?.url || e.keyImages[0]?.url || ''

      const cover = originalCover.startsWith('http')
        ? originalCover
        : originalCover.includes('?cover=')
          ? decodeURIComponent(originalCover.split('?cover=')[1] || '')
          : originalCover

      const isFreePrice = e.price.totalPrice.discountPrice === 0
      const isMatchStart = new Date(e.effectiveDate).getTime() < Date.now()
      const isMatchEnd = !e.expiryDate || new Date(e.expiryDate).getTime() >= Date.now()

      return {
        id: e.id || '',
        title: (e.title || '-').replace('Mystery Game', '神秘游戏'),
        cover,
        original_price: (e.price.totalPrice.originalPrice || 0) / 100 || 0,
        original_price_desc: e.price.totalPrice.fmtPrice.originalPrice || '暂无价格',
        description: (e.description || '暂无描述').replace('Mystery Game', '神秘游戏'),
        seller: e?.seller?.name || '未知发行商',
        is_free_now: isFreePrice && isMatchStart && isMatchEnd,
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

function getFreeOffer(e: GameItem) {
  const promotion =
    e.promotions?.upcomingPromotionalOffers.find((e) =>
      e.promotionalOffers.find((e) => e.discountSetting.discountPercentage === 0),
    ) ||
    e.promotions?.promotionalOffers.find((e) =>
      e.promotionalOffers.find((e) => e.discountSetting.discountPercentage === 0),
    )

  return promotion?.promotionalOffers.find((e) => e.discountSetting.discountPercentage === 0)
}

function compareDate(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime()
}

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
