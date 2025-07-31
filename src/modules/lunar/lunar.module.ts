import { SolarTime } from 'tyme4ts'
import { Common } from '../../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceLunar {
  handle(): RouterMiddleware<'/lunar'> {
    return (ctx) => {
      const date = ctx.request.url.searchParams.get('date')
      const now = date ? new Date(date) : new Date()

      const solarTime = SolarTime.fromYmdHms(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDay(),
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

      const data = {
        solar: {
          year: solarTime.getYear(),
          season: solarMonth.getSeason().getIndex() + 1,
          month: solarTime.getMonth(),
          day: solarTime.getDay(),
          hour: solarTime.getHour(),
          minute: solarTime.getMinute(),
          second: solarTime.getSecond(),
          is_leap_year: solarYear.isLeap(),
          week_of_month: solarWeek.getIndex() + 1,
          week_of_year: solarWeek.getIndexInYear() + 1,
          week_of_month_index: solarWeek.getIndex(),
          week_of_year_index: solarWeek.getIndexInYear(),
          season_index: solarMonth.getSeason().getIndex(),
          season_desc: solarMonth.getSeason().getName(),
          season_name: ['春', '夏', '秋', '冬'][solarMonth.getSeason().getIndex()],
          season_name_desc: ['春天', '夏天', '秋天', '冬天'][solarMonth.getSeason().getIndex()],
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
        solar_week: {
          week: solarWeek.getName(),
          count: solarWeek.getIndex() + 1,
          index: solarWeek.getIndex(),
        },
        taboo: {
          day: {
            recommends: lunarDay.getRecommends().map((e) => e.getName()),
            avoids: lunarDay.getAvoids().map((e) => e.getName()),
          },
          hour: {
            hour: lunarHour.getName().replace('时', ''),
            hour_desc: lunarHour.getName(),
            avoids: lunarHour.getAvoids().map((e) => e.getName()),
            recommends: lunarHour.getRecommends().map((e) => e.getName()),
          },
          hours: Array.from({ length: 12 }, (_, i) => {
            const hour = lunarHour.next(i)
            return {
              hour: hour.getName().replace('时', ''),
              recommends: hour.getRecommends().map((e) => e.getName()),
              avoids: hour.getAvoids().map((e) => e.getName()),
              hour_desc: hour.getName(),
            }
          }),
        },
        holiday: solarDay.getLegalHoliday()
          ? {
              name: solarDay.getLegalHoliday()?.getName(),
              is_work: solarDay.getLegalHoliday()?.isWork(),
            }
          : undefined,
        festivals: solarDay.getFestival()?.getName(),
        phase: lunarDay.getPhase().getName(),
        solar_term: solarTime.getTerm().getName(),
        solar_term_day: solarDay.getTerm().getName(),
        constellation: solarDay.getConstellation().getName(),
        constellation_desc: solarDay.getConstellation().getName() + '座',
      }

      return (ctx) => {
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
}

export const serviceLunar = new ServiceLunar()
