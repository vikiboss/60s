import { Common } from '../../common.ts'
import fabingData from './fabing.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceFabing {
  handle(): RouterMiddleware<'/fabing'> {
    return async (ctx) => {
      const name = (await Common.getParam('name', ctx.request)) || '主人'
      const id = await Common.getParam('id', ctx.request)
      
      let result: string
      
      if (id) {
        // 获取指定ID的发病文学
        const index = parseInt(id)
        if (index >= 0 && index < fabingData.length) {
          result = fabingData[index].replaceAll('[name]', name)
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${index} 的发病文学`)
          return
        }
      } else {
        // 随机获取发病文学（默认行为）
        result = Common.randomItem(fabingData).replaceAll('[name]', name)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result
          break

        case 'markdown':
          ctx.response.body = `# 💝 发病文学\n\n${result}\n\n---\n\n*献给: **${name}***`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: fabingData.findIndex(item => item.replaceAll('[name]', name) === result),
            saying: result,
          })
          break
      }
    }
  }
}

export const serviceFabing = new ServiceFabing()
