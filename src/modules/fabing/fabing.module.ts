import { Common } from '../../common.ts'
import fabingData from './fabing.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceFabing {
  async handle(ctx: AppContext) {
    const name = (await Common.getParam('name', ctx)) || '主人'
    const id = await Common.getParam('id', ctx)

    let result: string

    if (id) {
      // 获取指定ID的发病文学
      const index = parseInt(id)
      if (index >= 0 && index < fabingData.length) {
        result = fabingData[index].replaceAll('[name]', name)
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到ID为 ${index} 的发病文学`)
      }
    } else {
      // 随机获取发病文学（默认行为）
      result = Common.randomItem(fabingData).replaceAll('[name]', name)
    }

    switch (ctx.encoding) {
      case 'text':
        return result

      case 'markdown':
        return `# 💝 发病文学\n\n${result}\n\n---\n\n*献给: **${name}***`

      case 'json':
      default:
        return Common.buildJson({
          index: fabingData.findIndex((item) => item.replaceAll('[name]', name) === result),
          saying: result,
        })
    }
  }
}

export const serviceFabing = new ServiceFabing()
