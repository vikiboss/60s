import { SolarTime, LegalHoliday, Week } from 'tyme4ts'
import { Common, dayjs, TZ_SHANGHAI } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceLunar {
  handle(): RouterMiddleware<'/lunar'> {
    return (ctx) => {
      const date = ctx.request.url.searchParams.get('date')
      const now = date ? dayjs(date).tz(TZ_SHANGHAI).toDate() : new Date(Common.localeTime())

      const solarTime = SolarTime.fromYmdHms(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      )

      const solarDay = solarTime.getSolarDay()
      const solarMonth = solarDay.getSolarMonth()
      const solarYear = solarMonth.getSolarYear()
      const solarWeek = solarDay.getSolarWeek(0)
      // const solarWeekCN = solarDay.getSolarWeek(1)

      const lunarHour = solarTime.getLunarHour()
      const lunarDay = lunarHour.getLunarDay()
      const lunarMonth = lunarDay.getLunarMonth()
      const lunarYear = lunarMonth.getLunarYear()

      const holiday = solarDay.getLegalHoliday()

      const data = {
        solar: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: solarTime.getHour(),
          minute: solarTime.getMinute(),
          second: solarTime.getSecond(),
          day_of_year: solarDay.getIndexInYear() + 1,
          week: solarDay.getDay(),
          week_cn: Week.fromIndex(solarDay.getDay()).getName(),
          week_cn_desc: `星期${Week.fromIndex(solarDay.getDay()).getName()}`,
          week_of_month: solarWeek.getIndex() + 1,
          week_of_year: solarWeek.getIndexInYear() + 1,
          season: solarMonth.getSeason().getIndex() + 1,
          season_desc: solarMonth.getSeason().getName(),
          season_name: ['春', '夏', '秋', '冬'][solarMonth.getSeason().getIndex()],
          season_name_desc: ['春天', '夏天', '秋天', '冬天'][solarMonth.getSeason().getIndex()],
          is_leap_year: solarYear.isLeap(),
        },
        lunar: {
          year: lunarYear.getName().replace('农历', '').replace('年', ''),
          month: lunarMonth.getName().replace('闰', '').replace('月', ''),
          day: lunarDay.getName(),
          hour: lunarHour.getName().replace('时', ''),
          year_desc: lunarYear.getName(),
          month_desc: lunarMonth.getName(),
          day_desc: lunarDay.getName(),
          hour_desc: lunarHour.getName(),
          is_leap_month: lunarMonth.isLeap(),
        },
        term: {
          today: solarDay.getTermDay().getDayIndex() === 0 ? solarDay.getTermDay().getName() : null,
          stage: {
            name: solarDay.getTerm().getName(),
            position: solarDay.getTermDay().getDayIndex() + 1,
            isJie: solarDay.getTerm().isJie(),
            isQi: solarDay.getTerm().isQi(),
          },
        },
        zodiac: {
          year: lunarYear.getSixtyCycle().getEarthBranch().getZodiac().getName(),
          month: lunarMonth.getSixtyCycle().getEarthBranch().getZodiac().getName(),
          day: lunarDay.getSixtyCycle().getEarthBranch().getZodiac().getName(),
          hour: lunarHour.getSixtyCycle().getEarthBranch().getZodiac().getName(),
        },
        sixty_cycle: {
          year: {
            heaven_stem: lunarYear.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarYear.getSixtyCycle().getEarthBranch().getName(),
            full: lunarYear.getSixtyCycle().getName(),
            desc: lunarYear.getSixtyCycle().getName() + '年',
          },
          month: {
            heaven_stem: lunarMonth.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarMonth.getSixtyCycle().getEarthBranch().getName(),
            full: lunarMonth.getSixtyCycle().getName(),
            desc: lunarMonth.getSixtyCycle().getName() + '月',
          },
          day: {
            heaven_stem: lunarDay.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarDay.getSixtyCycle().getEarthBranch().getName(),
            full: lunarDay.getSixtyCycle().getName(),
            desc: lunarDay.getSixtyCycle().getName() + '日',
          },
          hour: {
            heaven_stem: lunarHour.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarHour.getSixtyCycle().getEarthBranch().getName(),
            full: lunarHour.getSixtyCycle().getName(),
            desc: lunarHour.getSixtyCycle().getName() + '时',
          },
        },
        legal_holiday: holiday
          ? {
              name: holiday?.getName(),
              is_work: holiday?.isWork(),
            }
          : null,
        festival: {
          solar: solarDay.getFestival()?.getName() ?? null,
          lunar: lunarDay.getFestival()?.getName() ?? null,
          desc:
            [solarDay.getFestival()?.getName(), lunarDay.getFestival()?.getName()].filter(Boolean).join('、') || null,
        },
        phase: {
          name: lunarDay.getPhase().getName(),
          position: lunarDay.getPhase().getIndex(),
        },
        constellation: {
          name: solarDay.getConstellation().getName(),
          desc: solarDay.getConstellation().getName() + '座',
        },
        legal_holiday_list: getHoliday(now),
        taboo: {
          day: {
            recommends: lunarDay
              .getRecommends()
              .map((e) => e.getName())
              .join('.'),
            avoids: lunarDay
              .getAvoids()
              .map((e) => e.getName())
              .join('.'),
          },
          hour: {
            hour: lunarHour.getName().replace('时', ''),
            hour_desc: lunarHour.getName(),
            avoids: lunarHour
              .getAvoids()
              .map((e) => e.getName())
              .join('.'),
            recommends: lunarHour
              .getRecommends()
              .map((e) => e.getName())
              .join('.'),
          },
          hours: Array.from({ length: 12 }, (_, i) => {
            const hour = lunarHour.next(i)
            return {
              hour: hour.getName().replace('时', ''),
              hour_desc: hour.getName(),
              recommends: hour
                .getRecommends()
                .map((e) => e.getName())
                .join('.'),
              avoids: hour
                .getAvoids()
                .map((e) => e.getName())
                .join('.'),
            }
          }),
        },
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }
}

export const serviceLunar = new ServiceLunar()

function getHoliday(now: Date) {
  const list = (LegalHoliday.DATA.match(/.{1,13}/g) || [])
    .filter((e) => e.startsWith(now.getFullYear().toString()))
    .map((e: string) => {
      return {
        date: e.slice(0, 8),
        name: LegalHoliday.NAMES[e[9]] || '-',
        is_work: LegalHoliday.NAMES[e[8]] === '0',
        is_after: e[10] === '+',
        is_before: e[10] === '-',
        offset: +e.slice(11, 13),
      }
    })
    .filter((e) => !e.is_work)

  return Object.entries(Object.groupBy(list, (e) => e.name)).map(([name, items = []]) => {
    return {
      name,
      start: items[0]?.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      end: items[items.length - 1]?.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    }
  })
}
