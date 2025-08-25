import { Common } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceDyParser {
  handle(): RouterMiddleware<'/dyParser'> {
    return async (ctx) => {
    }
  }
}

export const serviceKfc = new ServiceDyParser()
