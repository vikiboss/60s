import { Router } from '@oak/oak/router'

import { service60s } from '../module/60s.module'

export const router = new Router({
  prefix: '/api/v1',
})

router.get('/60s', service60s.handle())
