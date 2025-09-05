import { Common } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceDyParser {
  handle(): RouterMiddleware<'/dy-parser'> {
    return async (ctx) => {}
  }
}

export const serviceKfc = new ServiceDyParser()
