import fs from 'fs/promises'
import path from 'path'

export interface Data {
  DispExt: null
  QueryDispInfo: null
  ResultCode: number
  ResultNum: number
  QueryID: string
  Result: Array<{
    ClickNeed: string
    DisplayData: {
      StdStg: string
      StdStl: string
      resultData: {
        extData: {
          OriginQuery: string
          clickneed: string
          resourceid: string
        }
        tplData: {
          data: {
            SiteId: number
            StdStg: number
            StdStl: number
            _select_time: number
            _update_time: string
            _version: number
            almanac: {
              animal: string
              avoid: string
              cnDay: string
              day: string
              festivalInfoList?: {
                baikeId?: string
                baikeName?: string
                baikeUrl?: string
                name: string
              }[]
              festivalList?: string
              gzDate: string
              gzMonth: string
              gzYear: string
              houryjJumpUrl: string
              houryj_from: string
              isBigMonth: string
              jiri: string
              lDate: string
              lMonth: string
              lunarDate: string
              lunarMonth: string
              lunarYear: string
              month: string
              oDate: string
              suit: string
              term?: string
              timestamp: string
              type?: string
              value?: string
              year: string
              yjJumpUrl: string
              yj_from: string
              desc?: string
              status?: string
            }[]
            'almanac#num#baidu': number
            cambrian_appid: string
            key: string
            loc: string
            realurl: string
            showlamp: string
            tabList: Array<{
              feiji: Record<string, string[]>
              ji: Record<string, string[]>
              state: string
              tabName: string
            }>
            url: string
            xzhId: string
          }
          data_source: string
          disp_data_url_ex: {
            aesplitid: string
            sublink: string
            suppInfo: string
            suppinfo: string
            title: string
          }
          feedback_content: {}
          g_otherinfo: {
            OriginQuery: string
            is_show_big: string
          }
          url_trans_feature: {
            OriginQuery: string
            cluster_order: string
            is_show_big: string
          }
        }
      }
      strategy: {
        ctplOrPhp: string
        hilightWord: string
        precharge: string
      }
    }
    RecoverCacheTime: string
    ResultURL: string
    Sort: string
    SrcID: string
    SubResNum: string
    SubResult: any[]
    SuppInfo: string
    Title: string
    Weight: string
    ar_passthrough: {
      origin_srcid: string
      true_query: string
    }
  }>
}

// 简化的日历数据结构
interface CompactAlmanacData {
  y: number // 年
  m: number // 月
  d: number // 日
  l: number // 闰年标志，1=闰年，0=平年
  a: string // 生肖
  w: string // 星期
  s: string // 宜
  av: string // 忌
  t?: string // 类型
  lk: number // 是否吉日，1=是，0=否
  dc?: string // 描述
  f?: string // 节日
  g: [string, string, string] // 干支[年,月,日]
  ln: [number, number, number, string?, number?, string?] // 农历[年,月,日,月名?,大月?,日名?]
}

// 获取数据的函数
async function fetchData(year: number, month: number): Promise<Data | null> {
  const query = `${year}年${month.toString()}月`
  const encodedQuery = encodeURIComponent(query)
  const url = `https://opendata.baidu.com/data/inner?resource_id=52109&category=%E5%85%A8%E9%83%A8%2C%E6%90%AC%E5%AE%B6%2C%E7%BB%93%E5%A9%9A%2C%E5%BC%80%E4%B8%9A%2C%E5%87%BA%E8%A1%8C%2C%E7%A5%AD%E7%A5%80%2C%E5%8A%A8%E5%9C%9F&query=${encodedQuery}&apiType=jiriData`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch data for ${query}: ${response.status} ${response.statusText}`)
      return null
    }

    const data: Data = await response.json()

    if (data.ResultCode !== 0 || !data.Result || data.Result.length === 0) {
      console.error(`Invalid data structure for ${query}`)
      return null
    }

    console.log(`Successfully fetched data for ${query}`)
    return data
  } catch (error) {
    console.error(`Error fetching data for ${query}:`, error)
    return null
  }
}

// 主函数
async function main() {
  const startYear = 2000
  const endYear = 2050

  const allAlmanacData: CompactAlmanacData[] = []

  console.log(`开始获取 ${startYear} 年到 ${endYear} 年的数据...`)

  let totalRequests = 0
  let successfulRequests = 0

  for (let year = startYear; year <= endYear; year++) {
    console.log(`处理 ${year} 年的数据...`)

    for (let month = 1; month <= 12; month++) {
      totalRequests++

      const data = await fetchData(year, month)

      if (!data) {
        console.warn(`跳过 ${year} 年 ${month} 月的数据`)
        continue
      }

      successfulRequests++

      const result = data.Result[0]
      const tplData = result.DisplayData.resultData.tplData.data

      // 处理 almanac 数据
      if (tplData.almanac && Array.isArray(tplData.almanac)) {
        for (const e of tplData.almanac) {
          // 构建简化的数据结构
          const compactData: CompactAlmanacData = {
            y: +e.year,
            m: +e.month,
            d: +e.day,
            l: (+e.year % 4 === 0 && +e.year % 100 !== 0) || +e.year % 400 === 0 ? 1 : 0,
            a: e.animal,
            w: e.cnDay,
            s: e.suit,
            av: e.avoid,
            lk: e.jiri === '1' ? 1 : 0,
            g: [e.gzYear, e.gzMonth, e.gzDate],
            ln: [
              +e.lunarYear,
              +e.lunarMonth,
              +e.lunarDate,
              e.lMonth || undefined,
              e.isBigMonth === '1' ? 1 : 0,
              e.lDate || undefined,
            ],
          }

          // 添加可选字段
          if (e.type) compactData.t = e.type
          if (e.desc) compactData.dc = e.desc
          if (e.festivalList) compactData.f = e.festivalList

          allAlmanacData.push(compactData)
        }
      }

      // 每处理 100 个请求输出一次进度
      if (totalRequests % 100 === 0) {
        console.log(`进度: ${totalRequests}/${(endYear - startYear + 1) * 12} (成功: ${successfulRequests})`)
      }
    }
  }

  console.log(`数据获取完成！总请求: ${totalRequests}, 成功: ${successfulRequests}`)
  console.log(`获取到 ${allAlmanacData.length} 条日期数据`)

  // 按日期排序
  allAlmanacData.sort((a, b) => a.y - b.y || a.m - b.m || a.d - b.d)

  const data = Array.from(new Set(allAlmanacData.flatMap((e) => [...e.av.split('.'), ...e.s.split('.')])))
  console.log(data.length, JSON.stringify(data))

  // 保存数据到单个文件
  try {
    await fs.writeFile(
      path.join(process.cwd(), 'almanac-data.json'),
      JSON.stringify(allAlmanacData, null, 0), // 不使用格式化以减少文件大小
      'utf8',
    )
    console.log('数据已保存到 almanac-data.json')

    // 输出文件大小信息
    const stats = await fs.stat(path.join(process.cwd(), 'almanac-data.json'))
    console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  } catch (error) {
    console.error('保存文件时出错:', error)
  }
}

// 查询工具函数
export function queryDayInfo(
  data: CompactAlmanacData[],
  year: number,
  month: number,
  day: number,
): CompactAlmanacData | null {
  return data.find((item) => item.y === year && item.m === month && item.d === day) || null
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
