import type { RouterMiddleware } from '@oak/oak'

export abstract class Service<R extends string> {
  abstract handle(): RouterMiddleware<R>
}
