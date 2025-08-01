import { SolarTime, LegalHoliday, Zodiac, Week, Phase, Constellation } from 'tyme4ts'
import { Common, dayjs, TZ_SHANGHAI } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceLunar {
  handle(): RouterMiddleware<'/lunar'> {
    return (ctx) => {
      const date = ctx.request.url.searchParams.get('date')?.trim()

      const initDate = date
        ? date.match(/^\d{10}$/)
          ? +date * 1000
          : date.match(/^\d{13}$/)
            ? +date
            : date
        : undefined

      const now = dayjs(initDate).tz(TZ_SHANGHAI)

      const solarTime = SolarTime.fromYmdHms(
        now.year(),
        now.month() + 1,
        now.date(),
        now.hour(),
        now.minute(),
        now.second(),
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
          year: now.year(),
          month: now.month() + 1,
          day: now.date(),
          hour: now.hour(),
          minute: now.minute(),
          second: now.second(),
          full: dayjs(now).format('YYYY-MM-DD'),
          full_with_time: dayjs(now).format('YYYY-MM-DD HH:mm:ss'),
          week: now.day(),
          week_desc: `星期${Week.fromIndex(now.day()).getName()}`,
          week_desc_short: Week.fromIndex(now.day()).getName(),
          season: solarMonth.getSeason().getIndex() + 1,
          season_desc: solarMonth.getSeason().getName(),
          season_desc_short: solarMonth.getSeason().getName().replace('季度', ''),
          season_name: ['春', '夏', '秋', '冬'][solarMonth.getSeason().getIndex()],
          season_name_desc: ['春天', '夏天', '秋天', '冬天'][solarMonth.getSeason().getIndex()],
          is_leap_year: solarYear.isLeap(),
        },
        lunar: {
          year: lunarYear.getName().replace('农历', '').replace('年', ''),
          month: lunarMonth.getName().replace('闰', '').replace('月', ''),
          day: lunarDay.getName(),
          hour: lunarHour.getName().replace('时', ''),
          full_with_hour: `${lunarDay.toString()}${lunarHour.getName()}`,
          desc_short: lunarDay.toString(),
          year_desc: lunarYear.getName(),
          month_desc: lunarMonth.getName(),
          day_desc: lunarDay.getName(),
          hour_desc: lunarHour.getName(),
          is_leap_month: lunarMonth.isLeap(),
        },
        stats: {
          day_of_year: solarDay.getIndexInYear() + 1,
          week_of_year: solarWeek.getIndexInYear() + 1,
          week_of_month: solarWeek.getIndex() + 1,
          percents: {
            year: solarDay.getIndexInYear() / (solarYear.isLeap() ? 366 : 365),
            month: now.date() / solarMonth.getDayCount(),
            week: now.day() / 7,
            day: (now.valueOf() - dayjs(now).startOf('day').toDate().valueOf()) / (24 * 60 * 60 * 1000),
          },
          percents_formatted: {
            year: ((solarDay.getIndexInYear() / (solarYear.isLeap() ? 366 : 365)) * 100).toFixed(2) + '%',
            month: ((now.date() / solarMonth.getDayCount()) * 100).toFixed(2) + '%',
            week: ((now.day() / 7) * 100).toFixed(2) + '%',
            day:
              (((now.valueOf() - dayjs(now).startOf('day').toDate().valueOf()) / (24 * 60 * 60 * 1000)) * 100).toFixed(
                2,
              ) + '%',
          },
        },
        term: {
          today: solarDay.getTermDay().getDayIndex() === 0 ? solarDay.getTermDay().getName() : null,
          stage: {
            name: solarDay.getTerm().getName(),
            position: solarDay.getTermDay().getDayIndex() + 1,
            is_jie: solarDay.getTerm().isJie(),
            is_qi: solarDay.getTerm().isQi(),
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
            name: lunarYear.getSixtyCycle().getName() + '年',
            name_short: lunarYear.getSixtyCycle().getName(),
          },
          month: {
            heaven_stem: lunarMonth.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarMonth.getSixtyCycle().getEarthBranch().getName(),
            name: lunarMonth.getSixtyCycle().getName() + '月',
            name_short: lunarMonth.getSixtyCycle().getName(),
          },
          day: {
            heaven_stem: lunarDay.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarDay.getSixtyCycle().getEarthBranch().getName(),
            name: lunarDay.getSixtyCycle().getName() + '日',
            name_short: lunarDay.getSixtyCycle().getName(),
          },
          hour: {
            heaven_stem: lunarHour.getSixtyCycle().getHeavenStem().getName(),
            earth_branch: lunarHour.getSixtyCycle().getEarthBranch().getName(),
            name: lunarHour.getSixtyCycle().getName() + '时',
            name_short: lunarHour.getSixtyCycle().getName(),
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
          both_desc:
            [solarDay.getFestival()?.getName(), lunarDay.getFestival()?.getName()].filter(Boolean).join('、') || null,
        },
        phase: {
          name: lunarDay.getPhase().getName(),
          position: lunarDay.getPhase().getIndex() + 1,
        },
        constellation: {
          name: solarDay.getConstellation().getName() + '座',
          name_short: solarDay.getConstellation().getName(),
        },
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
            hour: lunarHour.getName(),
            hour_short: lunarHour.getName().replace('时', ''),
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
              hour: hour.getName(),
              hour_short: hour.getName().replace('时', ''),
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
        julian_day: solarDay.getJulianDay().getDay(),
        constants: {
          legal_holiday_list: getHoliday(now.year()),
          phase_list: Phase.NAMES.map((e, idx) => ({ name: e, lunar_day: idx + 1 })),
          zodiac_list: Zodiac.NAMES,
          constellation_list: getConstellation(),
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

function getHoliday(year: number) {
  const list = (LegalHoliday.DATA.match(/.{1,13}/g) || [])
    .filter((e) => e.startsWith(year.toString()))
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
    const targetDay = items.find((e) => e.offset === 0)
    return {
      name,
      date: targetDay?.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') || null,
      start: items[0]?.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      end: items[items.length - 1]?.date?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    }
  })
}

function getConstellation() {
  const startDates = [321, 420, 521, 622, 723, 823, 923, 1024, 1123, 1222, 120, 219]
  const endDates = [419, 520, 621, 722, 822, 922, 1023, 1122, 1221, 119, 218, 320]

  return Constellation.NAMES.map((name, index) => {
    const startDate = startDates[index]
    const endDate = endDates[index]
    const startMonth = Math.floor(startDate / 100)
    const startDay = startDate % 100
    const endMonth = Math.floor(endDate / 100)
    const endDay = endDate % 100
    const start = `${startMonth}月${startDay}日`
    const end = `${endMonth}月${endDay}日`
    const range = `${start}~${end}`

    return {
      name,
      desc: `${name}座`,
      start: start,
      end: end,
      range: range,
      start_month: startMonth,
      start_day: startDay,
      end_month: endMonth,
      end_day: endDay,
    }
  })
}
