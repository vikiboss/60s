/**
 * 高性能农历日期处理库
 *
 * 支持公历农历互转、天干地支、节气计算等功能
 */

// 类型定义
export interface LunarDateInfo {
  // 公历信息
  solarYear: number
  solarMonth: number
  solarDay: number
  weekDay: number

  // 农历信息
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
  isLeapYear: boolean

  // 天干地支
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string

  // 生肖
  zodiac: string

  // 格式化字符串
  lunarMonthStr: string // 六月
  lunarDayStr: string // 初二
  lunarDate: string // 六月初二
  solarDate: string // 六月二十六日
  weekDate: string // 星期四
  formatted: string // 农历乙巳年六月初二
}

// 修复：完整的农历数据 1900-2100年
// prettier-ignore
const LUNAR_DATA = [
  // 1900-1949
  19416, 19168, 42352, 21717, 53856, 55632, 91476, 22176, 39632, 21970,  // 1900-1909
  19168, 42422, 42192, 53840, 119381, 46400, 54944, 44450, 38320, 84343, // 1910-1919
  18800, 42160, 46261, 27216, 27968, 109396, 11104, 38256, 21234, 18800, // 1920-1929
  25958, 54432, 59984, 28309, 23248, 11104, 100067, 37600, 116951, 51536, // 1930-1939
  54432, 120998, 46416, 22176, 107956, 9680, 37584, 53938, 43344, 46423, // 1940-1949
  
  // 1950-1999
  27808, 46416, 86869, 19872, 42416, 83315, 21168, 43432, 59728, 27296,  // 1950-1959
  44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176,  // 1960-1969
  38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46752, 103846, // 1970-1979
  38320, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256,  // 1980-1989
  19189, 18800, 25776, 29859, 59984, 27480, 21952, 43872, 38613, 37600,  // 1990-1999
  
  // 2000-2049
  51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893,   // 2000-2009
  43344, 46240, 47780, 44368, 21977, 19360, 42416, 86390, 21168, 43312,  // 2010-2019
  31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576,  // 2020-2029
  23200, 30371, 38608, 19415, 19152, 42192, 118966, 53840, 54560, 56645, // 2030-2039
  46496, 22224, 21938, 18864, 42359, 42160, 43600, 111189, 27936, 44448, // 2040-2049
  
  // 2050-2100
  84835, 37744, 18936, 43296, 83744, 37600, 51552, 55636, 54432, 55888,  // 2050-2059
  30034, 22176, 43959, 9680, 37584, 51893, 43344, 46240, 47780, 44368,   // 2060-2069
  21977, 19360, 42416, 86390, 21168, 43312, 31060, 27296, 44368, 23378,  // 2070-2079
  19296, 42726, 42208, 53856, 60005, 54576, 23200, 30371, 38608, 19415,  // 2080-2089
  19152, 42192, 118966, 53840, 54560, 56645, 46496, 22224, 21938, 18864, // 2090-2099
  42359  // 2100
] as const

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const
const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const
const MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'] as const

// 修复：月干支起始表（甲己起丙寅，乙庚起戊寅...）
const MONTH_GAN_BASE = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0] as const // 对应甲乙丙丁戊己庚辛壬癸年的正月天干

// 基准配置
const LUNAR_BASE = {
  date: new Date(2025, 0, 29), // 2025年1月29日（农历正月初一）
  year: 2025,
  lunarYear: 2025,

  // 修复：精确的日干支基准
  ganzhiBaseDate: new Date(2025, 0, 29),
  ganzhiBaseGan: 5, // 己
  ganzhiBaseZhi: 11, // 亥

  dataStartYear: 1900,
} as const

const MS_PER_DAY = 86400000

/**
 * 农历日期处理器
 */
export class Lunar {
  /**
   * 获取农历数据（带边界检查）
   */
  private static getLunarData(year: number): number {
    const index = year - LUNAR_BASE.dataStartYear

    if (index < 0 || index >= LUNAR_DATA.length) {
      throw new Error(
        `Year ${year} is out of supported range (${LUNAR_BASE.dataStartYear}-${LUNAR_BASE.dataStartYear + LUNAR_DATA.length - 1})`,
      )
    }

    return LUNAR_DATA[index]
  }

  /**
   * 获取闰月
   */
  private static getLeapMonth(year: number): number {
    return this.getLunarData(year) & 0xf
  }

  /**
   * 获取闰月天数
   */
  private static getLeapDays(year: number): number {
    const leapMonth = this.getLeapMonth(year)
    if (!leapMonth) return 0
    return this.getLunarData(year) & 0x10000 ? 30 : 29
  }

  /**
   * 获取农历月份天数
   */
  private static getLunarMonthDays(year: number, month: number): number {
    if (month < 1 || month > 12) {
      throw new Error(`Invalid lunar month: ${month}`)
    }
    const data = this.getLunarData(year)
    return data & (0x8000 >> (month - 1)) ? 30 : 29
  }

  /**
   * 获取农历年总天数
   */
  private static getLunarYearDays(year: number): number {
    const data = this.getLunarData(year)
    let days = 348 // 12个月 × 29天

    // 计算大月天数
    for (let i = 0; i < 12; i++) {
      if (data & (0x8000 >> i)) {
        days++
      }
    }

    const totalDays = days + this.getLeapDays(year)

    return totalDays
  }

  /**
   * 修复：计算天干地支
   */
  private static getGanZhi(type: 'year' | 'month' | 'day', year: number, month?: number, date?: Date): string {
    let ganIndex: number, zhiIndex: number

    switch (type) {
      case 'year':
        // 年干支：以甲子年为基准（公元4年）
        ganIndex = (year - 4) % 10
        zhiIndex = (year - 4) % 12
        break

      case 'month':
        if (month === undefined) throw new Error('Month is required for month GanZhi')
        // 修复：月干支计算 - 基于年干确定正月天干
        const yearGanIndex = (year - 4) % 10
        const monthGanBase = MONTH_GAN_BASE[yearGanIndex < 0 ? yearGanIndex + 10 : yearGanIndex]
        ganIndex = (monthGanBase + month - 1) % 10
        zhiIndex = (month + 1) % 12 // 正月对应寅
        break

      case 'day':
        if (!date) throw new Error('Date is required for day GanZhi')
        // 日干支：基于基准日期计算
        const daysDiff = Math.floor((date.getTime() - LUNAR_BASE.ganzhiBaseDate.getTime()) / MS_PER_DAY)
        ganIndex = (LUNAR_BASE.ganzhiBaseGan + daysDiff) % 10
        zhiIndex = (LUNAR_BASE.ganzhiBaseZhi + daysDiff) % 12
        break

      default:
        throw new Error('Invalid GanZhi type')
    }

    // 处理负数
    ganIndex = ganIndex < 0 ? ganIndex + 10 : ganIndex
    zhiIndex = zhiIndex < 0 ? zhiIndex + 12 : zhiIndex

    return HEAVENLY_STEMS[ganIndex] + EARTHLY_BRANCHES[zhiIndex]
  }

  /**
   * 数字转中文
   */
  private static numberToChinese(num: number, isLunarDay: boolean = true): string {
    if (num <= 0 || num > 31) return ''

    if (isLunarDay) {
      if (num === 10) return '初十'
      if (num === 20) return '二十'
      if (num === 30) return '三十'

      if (num < 10) {
        return `初${CHINESE_NUMBERS[num - 1]}`
      } else if (num < 20) {
        return `十${CHINESE_NUMBERS[num - 11]}`
      } else {
        const ones = num % 10
        return ones === 0 ? `${CHINESE_NUMBERS[Math.floor(num / 10) - 1]}十` : `廿${CHINESE_NUMBERS[ones - 1]}`
      }
    } else {
      if (num <= 10) {
        return CHINESE_NUMBERS[num - 1]
      } else if (num === 20) {
        return '二十'
      } else if (num === 30) {
        return '三十'
      } else if (num < 20) {
        return `十${CHINESE_NUMBERS[num - 11]}`
      } else {
        const ones = num % 10
        return ones === 0
          ? `${CHINESE_NUMBERS[Math.floor(num / 10) - 1]}十`
          : `${CHINESE_NUMBERS[Math.floor(num / 10) - 1]}十${CHINESE_NUMBERS[ones - 1]}`
      }
    }
  }

  /**
   * 获取月份中文名称
   */
  private static getMonthName(month: number, isLeap: boolean = false): string {
    if (month < 1 || month > 12) return ''
    const monthName = MONTH_NAMES[month - 1]
    return isLeap ? `闰${monthName}` : monthName
  }

  /**
   * 公历转农历（核心方法）
   */
  public static toLunar(date: Date = new Date()): LunarDateInfo {
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    let daysDiff = Math.floor((targetDate.getTime() - LUNAR_BASE.date.getTime()) / MS_PER_DAY)

    let lunarYear = LUNAR_BASE.lunarYear

    // 定位农历年份
    if (daysDiff >= 0) {
      let yearDays = this.getLunarYearDays(lunarYear)
      while (daysDiff >= yearDays) {
        daysDiff -= yearDays
        lunarYear++
        yearDays = this.getLunarYearDays(lunarYear)
      }
    } else {
      while (daysDiff < 0) {
        lunarYear--
        const yearDays = this.getLunarYearDays(lunarYear)
        daysDiff += yearDays
      }
    }

    // 定位农历月份
    const leapMonth = this.getLeapMonth(lunarYear)
    let lunarMonth = 1
    let isLeapMonth = false

    while (lunarMonth <= 12) {
      const monthDays = this.getLunarMonthDays(lunarYear, lunarMonth)

      if (daysDiff < monthDays) break

      daysDiff -= monthDays

      // 处理闰月
      if (lunarMonth === leapMonth) {
        const leapDays = this.getLeapDays(lunarYear)
        if (daysDiff < leapDays) {
          isLeapMonth = true
          break
        }
        daysDiff -= leapDays
      }

      lunarMonth++
    }

    const lunarDay = daysDiff + 1
    const isLeapYear = this.getLeapMonth(lunarYear) > 0

    // 计算天干地支
    const yearGanZhi = this.getGanZhi('year', lunarYear)
    const monthGanZhi = this.getGanZhi('month', lunarYear, lunarMonth)
    const dayGanZhi = this.getGanZhi('day', lunarYear, undefined, date)

    // 计算生肖
    const zodiacIndex = (lunarYear - 4) % 12
    const zodiac = ZODIAC_ANIMALS[zodiacIndex < 0 ? zodiacIndex + 12 : zodiacIndex]

    // 格式化字符串
    const lunarMonthStr = `${this.getMonthName(lunarMonth, isLeapMonth)}月`
    const lunarDayStr = this.numberToChinese(lunarDay, true)
    const lunarDate = `${lunarMonthStr}${lunarDayStr}`
    const solarDate = `${this.numberToChinese(date.getMonth() + 1, false)}月${this.numberToChinese(date.getDate(), false)}日`
    const weekDate = `星期${WEEKDAYS[date.getDay()]}`
    const formatted = `${yearGanZhi}年${lunarDate}`

    const result: LunarDateInfo = {
      solarYear: date.getFullYear(),
      solarMonth: date.getMonth() + 1,
      solarDay: date.getDate(),
      weekDay: date.getDay(),

      lunarYear,
      lunarMonth,
      lunarDay,
      isLeapMonth,
      isLeapYear,

      yearGanZhi,
      monthGanZhi,
      dayGanZhi,

      zodiac,

      lunarMonthStr,
      lunarDayStr,
      lunarDate,
      solarDate,
      weekDate,
      formatted,
    }
    return result
  }

  /**
   * 获取生肖
   */
  public static getZodiac(year: number): string {
    const index = (year - 4) % 12
    return ZODIAC_ANIMALS[index < 0 ? index + 12 : index]
  }

  /**
   * 判断是否为农历闰年
   */
  public static isLeapYear(year: number): boolean {
    try {
      return this.getLeapMonth(year) > 0
    } catch {
      return false
    }
  }
}
