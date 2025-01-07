import { Router } from '@oak/oak/router'

import { service60s } from './module/60s.module'
import { serviceBaike } from './module/baike.module'
import { serviceBing } from './module/bing.module'

export const router = new Router({
  prefix: '/api/v1',
})

router.get('/60s', service60s.handle())
router.get('/baike', serviceBaike.handle())
router.get('/bing', serviceBing.handle())
