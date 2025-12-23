import { Common } from '../../common.ts'
import luckData from './luck.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceLuck {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)

    let result: any

    if (id) {
      // 获取指定ID的运势
      const index = parseInt(id)
      if (index >= 0 && index < luckData.length) {
        const luck = luckData[index]
        const tip = Common.randomItem(luck.content)
        const tip_index = luck.content.indexOf(tip)
        result = {
          luck_desc: luck['good-luck'],
          luck_rank: luck.rank,
          luck_tip: tip,
          luck_tip_index: tip_index,
        }
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到ID为 ${index} 的运势`)
        return
      }
    } else {
      // 随机获取运势（默认行为）
      const luck = Common.randomItem(luckData)
      const tip = Common.randomItem(luck.content)
      const tip_index = luck.content.indexOf(tip)
      result = {
        luck_desc: luck['good-luck'],
        luck_rank: luck.rank,
        luck_tip: tip,
        luck_tip_index: tip_index,
      }
    }

    switch (ctx.encoding) {
      case 'text':
        return `${result.luck_desc}: ${result.luck_tip}`
        break

      case 'markdown':
        return `# 🍀 今日运势\n\n## ${result.luck_desc}\n\n> ${result.luck_tip}\n\n**运势等级**: ${result.luck_rank}/10`
        break

      case 'json':
      default:
        return Common.buildJson(result)
        break
    }
  }
}

export const serviceLuck = new ServiceLuck()
