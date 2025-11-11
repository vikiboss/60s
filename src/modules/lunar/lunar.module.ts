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
        nayin: {
          year: getNayin(lunarYear.getSixtyCycle().getName()),
          month: getNayin(lunarMonth.getSixtyCycle().getName()),
          day: getNayin(lunarDay.getSixtyCycle().getName()),
          hour: getNayin(lunarHour.getSixtyCycle().getName()),
        },
        baizi: {
          year_baizi: getBaiziDescription(lunarYear.getSixtyCycle().getName()),
          day_baizi: getBaiziDescription(lunarDay.getSixtyCycle().getName()),
        },
        fortune: {
          today_luck: getDailyFortune(lunarDay.getSixtyCycle().getName()),
          career: getCareerFortune(lunarDay.getSixtyCycle().getName()),
          money: getMoneyFortune(lunarDay.getSixtyCycle().getName()),
          love: getLoveFortune(lunarDay.getSixtyCycle().getName()),
        },
        constants: {
          legal_holiday_list: getHoliday(now.year()),
          phase_list: Phase.NAMES.map((e, idx) => ({ name: e, lunar_day: idx + 1 })),
          zodiac_list: Zodiac.NAMES,
          constellation_list: getConstellation(),
          heaven_stems: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
          earth_branches: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
          solar_terms: getSolarTerms(),
        },
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `${data.solar.full} ${data.solar.week_desc} ${data.lunar.desc_short}\n${data.term.stage.name}第${data.term.stage.position}天\n${data.constellation.name} ${data.zodiac.year}年\n宜: ${data.taboo.day.recommends || '无'}\n忌: ${data.taboo.day.avoids || '无'}`
          break

        case 'markdown':
          ctx.response.body = `# 📅 ${data.solar.full} ${data.solar.week_desc}\n\n## 农历信息\n\n**${data.lunar.desc_short}** (${data.lunar.is_leap_month ? '闰月' : '平月'})\n\n**干支**: ${data.sixty_cycle.year.name} ${data.sixty_cycle.month.name} ${data.sixty_cycle.day.name}\n\n**生肖**: ${data.zodiac.year}年 ${data.zodiac.month}月 ${data.zodiac.day}日\n\n**纳音**: ${data.nayin.year}\n\n## 节气与星座\n\n**节气**: ${data.term.stage.name}第${data.term.stage.position}天${data.term.today ? ` (今日${data.term.today})` : ''}\n\n**星座**: ${data.constellation.name}\n\n**月相**: ${data.phase.name}\n\n## 宜忌\n\n${data.taboo.day.recommends ? `**宜**: ${data.taboo.day.recommends}\n\n` : ''}${data.taboo.day.avoids ? `**忌**: ${data.taboo.day.avoids}\n\n` : ''}## 时辰吉凶\n\n${data.taboo.hours
            .slice(0, 12)
            .map((h) => `### ${h.hour}\n\n${h.recommends ? `**宜**: ${h.recommends}\n\n` : ''}${h.avoids ? `**忌**: ${h.avoids}` : ''}`)
            .join('\n\n')}\n\n## 节日\n\n${data.festival.solar || data.festival.lunar ? data.festival.both_desc : '无'}\n\n${data.legal_holiday ? `### 法定节假日\n\n**${data.legal_holiday.name}** ${data.legal_holiday.is_work ? '(补班)' : '(休息)'}` : ''}\n\n## 运势\n\n**今日运势**: ${data.fortune.today_luck}\n\n**事业**: ${data.fortune.career}\n\n**财运**: ${data.fortune.money}\n\n**感情**: ${data.fortune.love}\n\n---\n\n*今年已过 ${data.stats.percents_formatted.year} | 本月已过 ${data.stats.percents_formatted.month}*`
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
        name: LegalHoliday.NAMES[Number(e[9])] || '-',
        is_work: LegalHoliday.NAMES[Number(e[8])] === '0',
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

function getNayin(ganzhi: string): string {
  const nayinMap: Record<string, string> = {
    甲子: '海中金',
    乙丑: '海中金',
    丙寅: '炉中火',
    丁卯: '炉中火',
    戊辰: '大林木',
    己巳: '大林木',
    庚午: '路旁土',
    辛未: '路旁土',
    壬申: '剑锋金',
    癸酉: '剑锋金',
    甲戌: '山头火',
    乙亥: '山头火',
    丙子: '涧下水',
    丁丑: '涧下水',
    戊寅: '城头土',
    己卯: '城头土',
    庚辰: '白蜡金',
    辛巳: '白蜡金',
    壬午: '杨柳木',
    癸未: '杨柳木',
    甲申: '泉中水',
    乙酉: '泉中水',
    丙戌: '屋上土',
    丁亥: '屋上土',
    戊子: '霹雳火',
    己丑: '霹雳火',
    庚寅: '松柏木',
    辛卯: '松柏木',
    壬辰: '长流水',
    癸巳: '长流水',
    甲午: '砂石金',
    乙未: '砂石金',
    丙申: '山下火',
    丁酉: '山下火',
    戊戌: '平地木',
    己亥: '平地木',
    庚子: '壁上土',
    辛丑: '壁上土',
    壬寅: '金箔金',
    癸卯: '金箔金',
    甲辰: '覆灯火',
    乙巳: '覆灯火',
    丙午: '天河水',
    丁未: '天河水',
    戊申: '大驿土',
    己酉: '大驿土',
    庚戌: '钗环金',
    辛亥: '钗环金',
    壬子: '桑柘木',
    癸丑: '桑柘木',
    甲寅: '大溪水',
    乙卯: '大溪水',
    丙辰: '沙中土',
    丁巳: '沙中土',
    戊午: '天上火',
    己未: '天上火',
    庚申: '石榴木',
    辛酉: '石榴木',
    壬戌: '大海水',
    癸亥: '大海水',
  }
  return nayinMap[ganzhi] || '未知'
}

function getBaiziDescription(ganzhi: string): string {
  const baiziMap: Record<string, string> = {
    甲子: '海中金命，做事有始有终，个性沉稳。',
    乙丑: '海中金命，为人忠厚老实，心地善良。',
    丙寅: '炉中火命，性格急躁但有才华。',
    丁卯: '炉中火命，聪明伶俐，善于交际。',
    戊辰: '大林木命，心胸宽广，有领导能力。',
    己巳: '大林木命，智慧过人，善于理财。',
  }
  return baiziMap[ganzhi] || '性格温和，为人正直诚信。'
}

function getDailyFortune(ganzhi: string): string {
  const fortunes = [
    '今日运势平稳，适合处理日常事务',
    '今日贵人运佳，有望得到他人帮助',
    '今日财运亨通，投资理财可获利',
    '今日感情运势不错，单身者有桃花',
    '今日工作顺利，上司赏识',
    '今日健康运佳，精神饱满',
    '今日学习运好，适合进修',
  ]
  const hash = ganzhi.charCodeAt(0) + ganzhi.charCodeAt(1)
  return fortunes[hash % fortunes.length]
}

function getCareerFortune(ganzhi: string): string {
  const careers = [
    '事业稳步上升，把握机会',
    '工作中有贵人相助',
    '适合团队合作，发挥所长',
    '创新思维得到认可',
    '领导能力突出，升职有望',
  ]
  const hash = ganzhi.charCodeAt(0) * 2 + ganzhi.charCodeAt(1)
  return careers[hash % careers.length]
}

function getMoneyFortune(ganzhi: string): string {
  const money = [
    '财运平稳，收支平衡',
    '正财运佳，工资奖金丰厚',
    '偏财运不错，可小试投资',
    '理财有道，积累渐丰',
    '支出较多，节俭为宜',
  ]
  const hash = ganzhi.charCodeAt(0) + ganzhi.charCodeAt(1) * 3
  return money[hash % money.length]
}

function getLoveFortune(ganzhi: string): string {
  const love = [
    '感情稳定，恋人关系和谐',
    '桃花运旺，单身者有缘分',
    '夫妻恩爱，家庭和睦',
    '感情需要沟通，避免误会',
    '情感丰富，表达爱意的好时机',
  ]
  const hash = ganzhi.charCodeAt(0) * 5 + ganzhi.charCodeAt(1)
  return love[hash % love.length]
}

function getSolarTerms(): Array<{ name: string; desc: string }> {
  return [
    { name: '立春', desc: '春季开始' },
    { name: '雨水', desc: '降雨增多' },
    { name: '惊蛰', desc: '春雷乍响' },
    { name: '春分', desc: '昼夜等长' },
    { name: '清明', desc: '天清地明' },
    { name: '谷雨', desc: '雨生百谷' },
    { name: '立夏', desc: '夏季开始' },
    { name: '小满', desc: '麦粒渐满' },
    { name: '芒种', desc: '麦类收割' },
    { name: '夏至', desc: '白昼最长' },
    { name: '小暑', desc: '天气渐热' },
    { name: '大暑', desc: '一年最热' },
    { name: '立秋', desc: '秋季开始' },
    { name: '处暑', desc: '暑热结束' },
    { name: '白露', desc: '露水增多' },
    { name: '秋分', desc: '昼夜等长' },
    { name: '寒露', desc: '露水渐凉' },
    { name: '霜降', desc: '开始降霜' },
    { name: '立冬', desc: '冬季开始' },
    { name: '小雪', desc: '开始降雪' },
    { name: '大雪', desc: '降雪增多' },
    { name: '冬至', desc: '白昼最短' },
    { name: '小寒', desc: '天气渐冷' },
    { name: '大寒', desc: '一年最冷' },
  ]
}
