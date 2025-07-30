import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

// fetch("https://d1.weather.com.cn/sk_2d/101190101.html", {
//   "headers": {
//     "cookie": "f_city=%E5%8D%97%E4%BA%AC%7C101190101%7C",
//     "Referer": "https://www.weather.com.cn/",
//   },
// }).then(e=>e.text()).then(console.log);

// var dataSK={"nameen":"nanjing","cityname":"南京","city":"101190101","temp":"31.8","tempf":"89.2","WD":"北风","wde":"N","WS":"2级","wse":"8km\/h","SD":"65%","sd":"65%","qy":"999","njd":"14km","time":"09:35","rain":"0","rain24h":"0","aqi":"33","aqi_pm25":"33","weather":"多云","weathere":"Cloudy","weathercode":"d01","limitnumber":"","date":"07月14日(星期一)"}

class ServiceWeather {
  public static options = (options?: { name: string; code: string }) => {
    const { name = '南京', code = '101190101' } = options || {}

    return {
      headers: {
        cookie: `f_city=${encodeURIComponent(`${name}|${code}|`)}`,
        referer: 'https://www.weather.com.cn/',
      },
    }
  }

  handle(): RouterMiddleware<'/weather'> {
    return async (ctx) => {
      // const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = 'weather: todo'
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson('weather: todo')
          break
      }
    }
  }

  handle7d(): RouterMiddleware<'/weather/7d'> {
    return async (ctx) => {
      // const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = 'weather: todo'
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson('weather: todo')
          break
      }
    }
  }

  async fetchLocation(name: string) {
    const api = `https://toy1.weather.com.cn/search?cityname=${encodeURIComponent(name)}&callback=success_jsonpCallback&_=${Date.now()}`

    const res = (await (await fetch(api, ServiceWeather.options())).text())
      .replace(/^success_jsonpCallback\(/, '')
      .replace(/\)$/, '')

    let locationStr = ''

    try {
      locationStr = JSON.parse(res ?? '{}')?.[0]?.ref ?? ''
    } catch {
      throw new Error('地点响应解析失败，请求返回内容: ' + res)
    }

    if (!locationStr) throw new Error('未查询到该地点，请求返回内容: ' + res)

    return this.parseLocationId(locationStr)
  }

  async fetchRealtime(search: string) {
    const parsed = await this.fetchLocation(search)

    const url = parsed.isTown
      ? `https://d1.weather.com.cn/dingzhi/${parsed.locationId}.html?_=${Date.now()}`
      : `https://d1.weather.com.cn/sk_2d/${parsed.locationId}.html?_=${Date.now()}`

    console.log('url', url)

    const text = (
      await (await fetch(url, ServiceWeather.options({ name: parsed.location, code: parsed.locationId }))).text()
    )
      .replace(/^\s*var\s*dataSK=/i, '')
      .replace(new RegExp(`var\\s*cityDZ${parsed.locationId}\\s*=\\s*`), '')
      .replace(new RegExp(`;\\s*var(.*)+$`), '')

    let data: null | Record<string, string> = null

    try {
      const parsedData = JSON.parse(text ?? '{}')
      data = parsedData?.weatherinfo || parsedData || null
    } catch {
      throw new Error('实时天气响应解析失败，请求返回内容: ' + text.slice(0, 100))
    }

    if (!data) {
      throw new Error('获取实时天气响应失败，请求返回内容: ' + text.slice(0, 100))
    }

    return {
      weather: data?.weather,
      weather_code: data?.weathercode,
      weather_code_night: data?.weathercoden,
      temperature: +data?.temp?.replace('℃', ''),
      temperature_night: +data?.tempn?.replace('℃', ''),
      forecast_time: data?.fctime ? this.parseForecastTime(data?.fctime ?? '').toLocaleString('zh-CN') : null,
      forecast_time_at: data?.fctime ? this.parseForecastTime(data?.fctime ?? '').getTime() : null,
      wind_strength: data?.ws ?? data?.WS,
      wind_direction: data?.wd ?? data?.WD,
      location: parsed,

      data,
    }
  }

  async fetch7d() {
    const api = ''
    const { data = {} } = await (await fetch(api)).json()

    //
  }

  parseLocationId(location: string) {
    // 101240504015
    // 101270101002~sichuan~二仙桥街道~erxianqiaojiedao~成华~chenghua~028~610000~sichuan~四川

    const [locationId, _, town, townId, city, cityId, areaCode, zipCode, provinceId, province] = location.split('~')

    const isProvince = town === city && city === province
    const isCity = town === city && city !== province
    const isTown = town !== city && city !== province

    return {
      province,
      provinceId,
      city,
      cityId,
      town,
      townId,

      isProvince,
      isCity,
      isTown,

      areaCode,
      zipCode,

      location: isTown ? `${province} ${city} ${town}` : isCity ? `${province} ${city}` : isProvince ? province : '',
      locationId: locationId,
      locationUrl: /\d{11}/.test(locationId)
        ? `http://forecast.weather.com.cn/town/weather1dn/${locationId}.shtml`
        : /\d{9}/.test(locationId)
          ? `http://www.weather.com.cn/weather1d/${locationId}.shtml`
          : /[a-zA-Z]+/.test(locationId)
            ? `http://www.weather.com.cn/html/province/${locationId}.shtml`
            : '',
    }
  }

  parseForecastTime(time: string) {
    const cleanTime = time.replace(/\D/g, '')
    const year = cleanTime.substring(0, 4)
    const month = cleanTime.substring(4, 6)
    const day = cleanTime.substring(6, 8)
    const hour = cleanTime.substring(8, 10) || '00'
    const minute = cleanTime.substring(10, 12) || '00'
    const second = cleanTime.substring(12, 14) || '00'
    return new Date(+year, +month - 1, +day, +hour, +minute, +second)
  }
}

export const serviceWeather = new ServiceWeather()

// await serviceWeather.fetchRealtime('雨花台').then(console.log)
