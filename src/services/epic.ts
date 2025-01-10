import { wrapperBaseRes } from '../utils.ts'

const epicApi =
  'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN'

export async function fetchEpicFreeGames(type: string = 'json') {
  const data = (await (await fetch(epicApi)).json()) || {}
  const games = data?.data?.Catalog?.searchStore?.elements || []

  const actualGames = games
    .filter((e: any) => e.offerType === 'BASE_GAME' && e.promotions)
    .sort((a: any, b: any) => {
      return a.promotions.upcomingPromotionalOffers.length - b.promotions.upcomingPromotionalOffers.length
    })

  return type === 'json'
    ? wrapperBaseRes(actualGames)
    : actualGames.map((e: any, idx: number) => `${idx + 1}. ${e.title}`).join('\n')
}
