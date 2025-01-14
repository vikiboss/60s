import { Common } from "../../common.ts";
import hitokotoData from './hitokoto.json' with { type: "json" }

import type { RouterMiddleware } from '@oak/oak'

class ServiceHitokoto {
  handle(): RouterMiddleware<'/hitokoto'> {
    return  (ctx) => {
      ctx.response.body= Common.randomItem(hitokotoData)
    }
  }
}


export const serviceHitokoto = new ServiceHitokoto()
