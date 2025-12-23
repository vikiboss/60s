import { Common } from '../../common.ts'
import dadJokeList from './dad-joke.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

class ServiceDadJoke {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)

    let result: string

    if (id) {
      // 获取指定 ID 的冷笑话
      const index = parseInt(id)
      if (index >= 0 && index < dadJokeList.length) {
        result = dadJokeList[index]
      } else {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到 ID 为 ${index} 的冷笑话`)
        return
      }
    } else {
      // 随机获取冷笑话（默认行为）
      result = Common.randomItem(dadJokeList)
    }

    switch (ctx.encoding) {
      case 'text':
        return result

      case 'markdown':
        return `# 😂 Dad Joke\n\n${result}\n\n---\n\n*#${dadJokeList.findIndex((item) => item === result) + 1}*`

      case 'json':
      default:
        return Common.buildJson({
          index: dadJokeList.findIndex((item) => item === result),
          content: result,
        })
    }
  }
}

export const serviceDadJoke = new ServiceDadJoke()
