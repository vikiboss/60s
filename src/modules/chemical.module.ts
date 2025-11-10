import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceChemical {
  handle(): RouterMiddleware<'/chemical'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)

      const finalId = id || Common.randomInt(1, 60_000_000).toString()

      const res = await fetch(`https://www.chemspider.com/Chemical-Structure.${finalId}.html`)
      const html = await res.text()
      const data = JSON.parse(/id="__NUXT_DATA__"[^>]*>([^<]*)</.exec(html)?.[1] || '[]')

      const result = {
        id: +finalId,
        name: data[9] || '',
        mass: data[16] ? toFixedNumber(data[16], 3) : '',
        formula: data[13] || '',
        image: `https://legacy.chemspider.com/ImagesHandler.ashx?id=${finalId}`,
        monoisotopicMass: data[17] ? toFixedNumber(data[17], 3) : '',
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `化学元素信息\n名称: ${result.name}\n分子式: ${result.formula}\n质量: ${result.mass}\n单同位素质量: ${result.monoisotopicMass}`
          break

        case 'markdown':
          ctx.response.body = `# 🧪 化学物质信息\n\n## ${result.name}\n\n**分子式**: ${result.formula}\n\n**质量**: ${result.mass}\n\n**单同位素质量**: ${result.monoisotopicMass}\n\n![结构式](${result.image})\n\n*ID: ${result.id}*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }
}

export const serviceChemical = new ServiceChemical()

function toFixedNumber(num: number, fixed: number): number {
  return +num.toFixed(fixed)
}
