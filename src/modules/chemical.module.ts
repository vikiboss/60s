import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceChemical {
  handle(): RouterMiddleware<'/chemical'> {
    return async ctx => {
      const id = ctx.request.url.searchParams.get('id') || Common.randomInt(1, 60_000_000)

      // 太复杂了，不适合
      // const id = ctx.request.url.searchParams.get('id') || Common.randomInt(1, 129_000_000)

      const res = await fetch(`https://www.chemspider.com/Chemical-Structure.${id}.html`)
      const html = await res.text()
      // console.log(html)
      // const data = JSON.parse(html.split('id="__NUXT_DATA__"【】>')[1]?.split('</script>')[0] || '[]'
      const data = JSON.parse(/id="__NUXT_DATA__"[^>]*>([^<]*)</.exec(html)?.[1] || '[]')
      // console.log('=====\n\n', data[7], data[14], data[11], data[15])

      ctx.response.body = Common.buildJson({
        id: +id,
        name: data[9] || '',
        mass: data[16] ? toFixedNumber(data[16], 3) : '',
        formula: data[13] || '',
        image: `https://legacy.chemspider.com/ImagesHandler.ashx?id=${id}`,
        monoisotopicMass: data[17] ? toFixedNumber(data[17], 3) : '',
      })
    }
  }
}

export const serviceChemical = new ServiceChemical()

function toFixedNumber(num: number, fixed: number): number {
  return +num.toFixed(fixed)
}
