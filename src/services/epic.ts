import { wrapperBaseRes } from '../utils.ts'

const epicApi =
  'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN'

function isPass7DaysAgo(date: string) {
  return new Date(date).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
}

export async function fetchEpicFreeGames(type: string = 'json') {
  const data = (await (await fetch(epicApi)).json()) || {}
  const games = data?.data?.Catalog?.searchStore?.elements || []

  // deno-lint-ignore no-explicit-any
  const actualGames = games.filter((e: any) => isPass7DaysAgo(e.effectiveDate))

  return type === 'json'
    ? wrapperBaseRes(actualGames)
    : // deno-lint-ignore no-explicit-any
      actualGames.map((e: any, idx: number) => `${idx + 1}. ${e.title}`).join('\n')
}
