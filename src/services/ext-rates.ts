import { responseWithBaseRes } from '../utils.ts'

const api = 'https://open.er-api.com/v6/latest/'
const caches = new Map()

export async function fetchRatesByCurrency(currency = 'CNY', type = 'json') {
  const dailyUniqueKey = `${currency.toUpperCase()}-${new Date().toLocaleDateString()}`
  const cache = caches.get(dailyUniqueKey)

  let data

  if (cache) {
    data = cache
  } else {
    const { rates } = await (await fetch(`${api}/${currency}`)).json()
    caches.set(dailyUniqueKey, rates)
    data = rates
  }

  if (type === 'json') {
    return responseWithBaseRes(data)
  } else {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  }
}
