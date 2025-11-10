import { Common } from '../../common.ts'
import dadJokeList from './dad-joke.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

class ServiceDadJoke {

  handle(): RouterMiddleware<'/dad-joke'> {
    return async (ctx) => {
      const id = await Common.getParam('id', ctx.request)

      let result: string

      if (id) {
        // 获取指定 ID 的冷笑话
        const index = parseInt(id)
        if (index >= 0 && index < dadJokeList.length) {
          result = dadJokeList[index]
        } else {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到 ID 为 ${index} 的冷笑话`)
          return
        }
      } else {
        // 随机获取冷笑话（默认行为）
        result = Common.randomItem(dadJokeList)
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = result
          break

        case 'markdown':
          ctx.response.body = `# 😂 Dad Joke\n\n${result}\n\n---\n\n*#${dadJokeList.findIndex((item) => item === result) + 1}*`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson({
            index: dadJokeList.findIndex((item) => item === result),
            content: result,
          })
          break
      }
    }
  }

}

export const serviceDadJoke = new ServiceDadJoke()