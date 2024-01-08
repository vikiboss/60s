import { fileURLToPath } from 'node:url'
import { responseWithBaseRes } from '../../utils.ts'

const str = await Deno.readTextFile(fileURLToPath(new URL('./seism-list.json', import.meta.url)))
const data = JSON.parse(str) as any[]

Deno.cron('sample cron', '0 0 * * *', () => {
  console.log('cron job executed')
})

export async function fetchSeism(type = 'json') {
  return data
    .filter(item => item.magnitude >= 7)
    .map(item => {
      const { time, location, magnitude } = item
      return {
        time,
        location,
        magnitude
      }
    })
}
