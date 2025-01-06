import type { Middleware } from '@oak/oak'

export abstract class Service {
  abstract handle(): Middleware
}
