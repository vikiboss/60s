import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceChemical {
  handle(): RouterMiddleware<'/chemical'> {
    return async (ctx) => {
      const id = ctx.request.url.searchParams.get('id') || Common.randomInt(1, 60_000_000)

      // 太复杂了，不适合
      // const id = ctx.request.url.searchParams.get('id') || Common.randomInt(1, 129_000_000)

      const res = await fetch(`https://www.chemspider.com/Chemical-Structure.${id}.html`)
      const html = await res.text()
      const data = JSON.parse(html.split('id="__NUXT_DATA__" data-ssr="true">')[1]?.split('</script>')[0] || '[]')

      ctx.response.body = {
        id: +id,
        name: data[7] || '',
        mass: data[14] ? toFixedNumber(data[14], 3) : '',
        formula: data[11] || '',
        image: `https://legacy.chemspider.com/ImagesHandler.ashx?id=${id}`,
        monoisotopicMass: data[15] ? toFixedNumber(data[15], 3) : '',
      }
    }
  }
}

export const serviceChemical = new ServiceChemical()

function toFixedNumber(num: number, fixed: number): number {
  return +num.toFixed(fixed)
}
