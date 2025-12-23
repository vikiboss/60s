import type { Context } from 'elysia'

// Elysia 上下文类型，包含 encoding 扩展
export interface AppContext extends Context {
  encoding: string
}
