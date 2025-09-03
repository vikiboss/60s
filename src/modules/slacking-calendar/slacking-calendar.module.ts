import { Common, dayjs } from '../../common.ts'
import holidaysData from './holidays.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'


class ServiceSlackingCalendar {
  private cache = new Map<string, SlackingCalendar>()
  private lastCacheDate: string = ''

  handle(): RouterMiddleware<'/slacking-calendar'> {
    return async (ctx) => {
      const data = this.getHoliday()

      switch (ctx.state.encoding) {
        case 'text': {
          let body = '摸鱼日历\n\n'
          if (data.current) {
            const {name, dayOfHoliday, daysRemaining} = data.current
            body += `您正处于【${name}】假期中！\n今天是假期的第 ${dayOfHoliday} 天，还剩 ${daysRemaining} 天（含今天）。\n\n`
          }
          body += `下一个假期是【${data.name}】\n${data.until === 0 ? '就是明天啦！' : `距离现在还有 ${data.until} 天。`}\n`
          body += `假期共 ${data.duration} 天${data.workdays.length === 0 ? '。' : '，需要调休。'}`
          ctx.response.body = body
          break
        }

        case 'json':
        default: {
          ctx.response.body = Common.buildJson(data)
          break
        }
      }
    }
  }

  private getHoliday(): SlackingCalendar {
    const today = dayjs().startOf('day')
    const cacheKey = today.format('YYYY-MM-DD')

    // 判断是否需要清除旧的缓存（当天之前都是需要被清除的）
    if (cacheKey !== this.lastCacheDate) {
      this.cache.clear()
      this.lastCacheDate = cacheKey
    }

    // 检查是否存在有效缓存
    const cachedEntry = this.cache.get(cacheKey)
    if (cachedEntry) {
      return cachedEntry
    }

    const currentYear = today.year()
    const holidays: LocalYearHolidays = holidaysData

    // 检查当前是否处于某个假期期间
    const inHoliday: Holiday | undefined = (holidays[currentYear] || []).find((holiday) => {
      const startDate = dayjs(holiday.date).startOf('day')
      const endDate = startDate.add(holiday.duration - 1, 'day')
      return today.isBetween(startDate, endDate, 'day', '[]')
    })

    let current: CurrentHoliday | undefined
    if (inHoliday) {
      const startDate = dayjs(inHoliday.date).startOf('day')
      const dayOfHoliday = today.diff(startDate, 'day') + 1
      const daysRemaining = inHoliday.duration - dayOfHoliday + 1
      current = {
        name: inHoliday.name,
        dayOfHoliday,
        daysRemaining
      }
    }

    // 查找下一个即将到来的假期
    const searchableHolidays: Holiday[] = [
      ...(holidays[currentYear] || []),
      ...(holidays[currentYear + 1] || []),
    ]

    const nextHoliday = searchableHolidays.find(h => dayjs(h.date).isAfter(today))
    if (!nextHoliday) {
      throw new Error('当前数据源中不存在下一个假期记录')
    }

    const result: SlackingCalendar = {
      name: nextHoliday.name,
      date: nextHoliday.date,
      until: dayjs(nextHoliday.date).diff(today, 'day'),
      duration: nextHoliday.duration,
      workdays: nextHoliday.workdays,
    }

    if (current) {
      result.current = current
    }

    // 保存有效缓存
    this.cache.set(cacheKey, result)
    return result
  }

}

export const serviceSlackingCalendar = new ServiceSlackingCalendar()

/**
 * 节假日数据
 */
interface Holiday {
  /**
   * 节假日名称
   */
  name: string
  /**
   * 节假日日期，格式 'YYYY-MM-DD'
   */
  date: string
  /**
   * 节假日持续天数
   */
  duration: number
  /**
   * 调休日期列表，格式 'YYYY-MM-DD'
   */
  workdays: string[]
}

/**
 * 以年份为键，存储当年所有节假日信息
 */
type LocalYearHolidays = Record<string, Holiday[]>

/**
 * 当前节假日信息
 */
interface CurrentHoliday {
  /**
   * 节假日名称
   */
  name: string
  /**
   * 当前日期在节假日中的天数（从1开始计数）
   */
  dayOfHoliday: number
  /**
   * 节假日剩余的天数（包含当天）
   */
  daysRemaining: number
}

/**
 * Slacking Calendar 响应
 */
interface SlackingCalendar {
  /**
   * 下一个节假日名称
   */
  name: string
  /**
   * 节假日日期，格式 'YYYY-MM-DD'
   */
  date: string
  /**
   * 距离该节假日的天数
   */
  until: number
  /**
   * 节假日持续天数
   */
  duration: number
  /**
   * 调休日期列表，格式 'YYYY-MM-DD'
   */
  workdays: string[]
  /**
   * 当前节假日信息，如果当前日期正处于节假日期间，则包含该信息
   */
  current?: CurrentHoliday
}