import { Common } from "../../common.ts";
import fabingData from './fabing.json' with { type: "json" }

import type { RouterMiddleware } from '@oak/oak'

class ServiceFabing {
  handle(): RouterMiddleware<'/fabing'> {
    return  (ctx) => {
      ctx.response.body= Common.randomItem(fabingData)
    }
  }
}


export const serviceFabing = new ServiceFabing()
