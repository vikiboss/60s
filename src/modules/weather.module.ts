import { Common, dayjs } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

interface CityInfo {
  name: string
  province: string
  city: string
  county?: string
  code: string
}

interface WeatherObserve {
  degree: string
  humidity: string
  precipitation: string
  pressure: string
  update_time: string
  weather: string
  weather_code: string
  weather_short: string
  wind_direction: string
  wind_power: string
  wind_direction_name: string
  weather_url: string
  weather_color: string[]
}

interface AirQuality {
  aqi: number
  aqi_level: number
  aqi_name: string
  co: string
  no2: string
  o3: string
  pm10: string
  pm25: string
  so2: string
  update_time: string
  rank: number
  total: number
}

interface WeatherIndexItem {
  detail: string
  info: string
  name: string
  url?: string
}

interface WeatherIndex {
  [key: string]: WeatherIndexItem
}

interface WeatherAlarm {
  city: string
  county: string
  detail: string
  info: string
  level_code: string
  level_name: string
  province: string
  type_code: string
  type_name: string
  update_time: string
  url: string
}

interface HourlyForecast {
  degree: string
  update_time: string
  weather: string
  weather_code: string
  weather_short: string
  wind_direction: string
  wind_power: string
  weather_url: string
}

interface DailyForecast {
  day_weather: string
  day_weather_code: string
  day_wind_direction: string
  day_wind_power: string
  min_degree: string
  max_degree: string
  night_weather: string
  night_weather_code: string
  night_wind_direction: string
  night_wind_power: string
  time: string
  aqi: number
  aqi_level: number
  aqi_name: string
  day_weather_url: string
  night_weather_url: string
}

interface SunRise {
  sunrise: string
  sunset: string
  time: string
}

interface CitySearchResponse {
  status: number
  message?: string
  data?: Record<string, string>
}

interface WeatherApiResponse {
  status: number
  message?: string
  data?: {
    observe?: WeatherObserve
    forecast_1h?: HourlyForecast[]
    forecast_24h?: DailyForecast[]
    index?: WeatherIndex
    alarm?: WeatherAlarm[]
    rise?: SunRise[]
    air?: AirQuality
  }
}

class ServiceWeather {
  private cityCache = new Map<string, CityInfo>()

  private isValidCitySearchResponse(data: unknown): data is CitySearchResponse {
    return typeof data === 'object' && data !== null && typeof (data as any).status === 'number'
  }

  private isValidWeatherResponse(data: unknown): data is WeatherApiResponse {
    return typeof data === 'object' && data !== null && typeof (data as any).status === 'number'
  }

  private safeParseInt(value: string | undefined, fallback = 0): number {
    if (!value) return fallback
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  private safeParseFloat(value: string | undefined, fallback = 0): number {
    if (!value) return fallback
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  handle(): RouterMiddleware<'/weather'> {
    return async (ctx) => {
      try {
        const location = (await Common.getParam('query', ctx.request)) || '北京'
        const cityInfo = await this.getCityInfo(location)

        const [weatherData, airData] = await Promise.all([
          this.fetchCurrentWeather(cityInfo),
          this.fetchAirQuality(cityInfo),
        ])

        const observe = weatherData.observe

        if (!observe) {
          throw new Error('无法获取当前天气观测数据')
        }

        if (!airData) {
          throw new Error('无法获取空气质量数据')
        }

        const result = {
          location: {
            name: `${cityInfo.province}${cityInfo.city}${cityInfo.county || ''}`.replace(/省|市/g, ''),
            province: cityInfo.province,
            city: cityInfo.city,
            county: cityInfo.county || '',
          },
          weather: {
            condition: observe.weather,
            condition_code: observe.weather_code,
            temperature: this.safeParseInt(observe.degree),
            humidity: this.safeParseInt(observe.humidity),
            pressure: this.safeParseInt(observe.pressure),
            precipitation: this.safeParseFloat(observe.precipitation),
            wind_direction: observe.wind_direction_name,
            wind_power: observe.wind_power,
            weather_icon: observe.weather_url,
            weather_colors: observe.weather_color || [],
            updated: this.formatUpdateTime(observe.update_time),
            updated_at: new Date(this.formatUpdateTime(observe.update_time)).getTime(),
          },
          air_quality: airData.air
            ? {
                aqi: airData.air.aqi,
                level: airData.air.aqi_level,
                quality: airData.air.aqi_name,
                pm25: this.safeParseInt(airData.air.pm25),
                pm10: this.safeParseInt(airData.air.pm10),
                co: this.safeParseFloat(airData.air.co),
                no2: this.safeParseInt(airData.air.no2),
                o3: this.safeParseInt(airData.air.o3),
                so2: this.safeParseInt(airData.air.so2),
                rank: airData.air.rank,
                total_cities: airData.air.total,
                updated: this.formatUpdateTime(airData.air.update_time),
                updated_at: new Date(this.formatUpdateTime(airData.air.update_time)).getTime(),
              }
            : null,
          sunrise: weatherData.rise?.[0]
            ? (() => {
                const sunriseData = this.formatSunriseTime(weatherData.rise[0].time, weatherData.rise[0].sunrise)
                const sunsetData = this.formatSunriseTime(weatherData.rise[0].time, weatherData.rise[0].sunset)
                return {
                  sunrise: sunriseData.formatted,
                  sunrise_at: sunriseData.timestamp,
                  sunrise_desc: weatherData.rise[0].sunrise,
                  sunset: sunsetData.formatted,
                  sunset_at: sunsetData.timestamp,
                  sunset_desc: weatherData.rise[0].sunset,
                }
              })()
            : null,
          life_indices: this.formatLifeIndices(weatherData.index || {}),
          alerts: Array.isArray(weatherData.alarm)
            ? weatherData.alarm.map((alarm) => ({
                type: alarm.type_name,
                level: alarm.level_name,
                level_code: alarm.level_code,
                province: alarm.province,
                city: alarm.city,
                county: alarm.county,
                detail: alarm.detail,
                updated: dayjs(alarm.update_time).format('YYYY-MM-DD HH:mm:ss'),
                updated_at: dayjs(alarm.update_time).toDate().getTime(),
              }))
            : [],
        }

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = this.formatWeatherText(result)
            break

          case 'markdown':
            ctx.response.body = this.formatWeatherMarkdown(result)
            break

          case 'json':
          default:
            ctx.response.body = Common.buildJson(result)
            break
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        const statusCode = message.includes('未找到城市') ? 404 : 500
        ctx.response.body = Common.buildJson({ error: message }, statusCode)
      }
    }
  }

  handleForecast(): RouterMiddleware<'/weather/forecast'> {
    return async (ctx) => {
      try {
        const location = (await Common.getParam('query', ctx.request)) || '北京'
        const days = Number.parseInt((await Common.getParam('days', ctx.request)) || '7')
        const cityInfo = await this.getCityInfo(location)

        const weatherData = await this.fetchCurrentWeather(cityInfo)

        const result = {
          location: {
            name: `${cityInfo.province}${cityInfo.city}${cityInfo.county || ''}`.replace(/省|市/g, ''),
            province: cityInfo.province,
            city: cityInfo.city,
            county: cityInfo.county || '',
          },
          hourly_forecast: Array.isArray(weatherData.forecast_1h)
            ? weatherData.forecast_1h.slice(0, 48).map((hour) => ({
                datetime: this.formatHourlyTime(hour.update_time),
                temperature: this.safeParseInt(hour.degree),
                condition: hour.weather,
                condition_code: hour.weather_code,
                wind_direction: hour.wind_direction,
                wind_power: hour.wind_power,
                weather_icon: hour.weather_url,
              }))
            : [],
          daily_forecast: Array.isArray(weatherData.forecast_24h)
            ? weatherData.forecast_24h.slice(0, Math.min(days, 8)).map((day) => ({
                date: day.time,
                day_condition: day.day_weather,
                day_condition_code: day.day_weather_code,
                night_condition: day.night_weather,
                night_condition_code: day.night_weather_code,
                max_temperature: this.safeParseInt(day.max_degree),
                min_temperature: this.safeParseInt(day.min_degree),
                day_wind_direction: day.day_wind_direction,
                day_wind_power: day.day_wind_power,
                night_wind_direction: day.night_wind_direction,
                night_wind_power: day.night_wind_power,
                aqi: day.aqi,
                aqi_level: day.aqi_level,
                air_quality: day.aqi_name,
                day_weather_icon: day.day_weather_url,
                night_weather_icon: day.night_weather_url,
              }))
            : [],
          sunrise_sunset: Array.isArray(weatherData.rise)
            ? weatherData.rise.slice(0, Math.min(days, 15)).map((day) => {
                const sunriseData = this.formatSunriseTime(day.time, day.sunrise)
                const sunsetData = this.formatSunriseTime(day.time, day.sunset)
                return {
                  sunrise: sunriseData.formatted,
                  sunrise_at: sunriseData.timestamp,
                  sunrise_desc: day.sunrise,
                  sunset: sunsetData.formatted,
                  sunset_at: sunsetData.timestamp,
                  sunset_desc: day.sunset,
                }
              })
            : [],
        }

        switch (ctx.state.encoding) {
          case 'text':
            ctx.response.body = this.formatForecastText(result)
            break

          case 'markdown':
            ctx.response.body = this.formatForecastMarkdown(result)
            break

          case 'json':
          default:
            ctx.response.body = Common.buildJson(result)
            break
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        const statusCode = message.includes('未找到城市') ? 404 : 500
        ctx.response.body = Common.buildJson({ error: message }, statusCode)
      }
    }
  }

  private async getCityInfo(location: string): Promise<CityInfo> {
    const cacheKey = location.toLowerCase()
    if (this.cityCache.has(cacheKey)) {
      return this.cityCache.get(cacheKey)!
    }

    const cityInfo = await this.searchCity(location)
    this.cityCache.set(cacheKey, cityInfo)
    return cityInfo
  }

  private async searchCity(location: string): Promise<CityInfo> {
    const cleanLocation = location.replace(/市|省|区|县/g, '')
    const encodedLocation = encodeURIComponent(cleanLocation)

    const url = `https://i.news.qq.com/city/like?source=pc&city=${encodedLocation}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': Common.chromeUA,
        Referer: 'https://news.qq.com/',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`城市搜索API请求失败: ${response.status}`)
    }

    const data = await response.json()

    if (!this.isValidCitySearchResponse(data)) {
      throw new Error('城市搜索API返回数据格式错误')
    }

    if (data.status !== 200) {
      throw new Error(`城市搜索失败: ${data.message || '未知错误'}`)
    }

    if (!data.data || Object.keys(data.data).length === 0) {
      throw new Error(`未找到城市: ${location}。请检查城市名称拼写是否正确`)
    }

    const [code, locationStr] = Object.entries(data.data)[0] as [string, string]
    const locationParts = locationStr.split(',').map((part) => part.trim())
    const [province, city, county] = locationParts

    return {
      name: cleanLocation,
      province: province + (province.endsWith('省') || province.endsWith('市') ? '' : '省'),
      city: city + (city.endsWith('市') ? '' : '市'),
      county: county || undefined,
      code,
    }
  }

  private async fetchCurrentWeather(cityInfo: CityInfo) {
    const province = encodeURIComponent(cityInfo.province)
    const city = encodeURIComponent(cityInfo.city)
    const county = cityInfo.county ? encodeURIComponent(cityInfo.county) : ''

    const url = `https://i.news.qq.com/weather/common?source=pc&weather_type=observe%7Cforecast_1h%7Cforecast_24h%7Cindex%7Calarm%7Climit%7Ctips%7Crise&province=${province}&city=${city}&county=${county}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': Common.chromeUA,
        Referer: 'https://news.qq.com/',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`天气数据API请求失败: ${response.status}`)
    }

    const data = await response.json()

    if (!this.isValidWeatherResponse(data)) {
      throw new Error('天气数据API返回数据格式错误')
    }

    if (data.status !== 200) {
      throw new Error(`天气数据获取失败: ${data.message || '未知错误'}`)
    }

    if (!data.data?.observe) {
      throw new Error('未获取到天气观测数据')
    }

    return data.data
  }

  private async fetchAirQuality(cityInfo: CityInfo) {
    const province = encodeURIComponent(cityInfo.province)
    const city = encodeURIComponent(cityInfo.city)

    const url = `https://i.news.qq.com/weather/common?source=pc&weather_type=air%7Crise&province=${province}&city=${city}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': Common.chromeUA,
        Referer: 'https://news.qq.com/',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`空气质量API请求失败: ${response.status}`)
    }

    const data = await response.json()

    if (!this.isValidWeatherResponse(data)) {
      throw new Error('空气质量API返回数据格式错误')
    }

    if (data.status !== 200) {
      throw new Error(`空气质量数据获取失败: ${data.message || '未知错误'}`)
    }

    return data.data
  }

  private formatUpdateTime(timeStr: string): string {
    if (timeStr.length === 12) {
      const year = timeStr.substring(0, 4)
      const month = timeStr.substring(4, 6)
      const day = timeStr.substring(6, 8)
      const hour = timeStr.substring(8, 10)
      const minute = timeStr.substring(10, 12)
      return dayjs(`${year}-${month}-${day} ${hour}:${minute}:00`).format('YYYY-MM-DD HH:mm:ss')
    }
    return timeStr
  }

  private formatSunriseTime(date: string, time: string): { formatted: string; timestamp: number } {
    // date format: "20250908", time format: "05:44"
    const year = date.substring(0, 4)
    const month = date.substring(4, 6)
    const day = date.substring(6, 8)
    const dateTimeStr = `${year}-${month}-${day} ${time}:00`
    const dateObj = dayjs(dateTimeStr)
    return {
      formatted: dateObj.format('YYYY-MM-DD HH:mm:ss'),
      timestamp: dateObj.toDate().getTime(),
    }
  }

  private formatHourlyTime(timeStr: string): string {
    if (timeStr.length === 14) {
      const year = timeStr.substring(0, 4)
      const month = timeStr.substring(4, 6)
      const day = timeStr.substring(6, 8)
      const hour = timeStr.substring(8, 10)
      const minute = timeStr.substring(10, 12)
      return `${year}-${month}-${day} ${hour}:${minute}`
    }
    return timeStr
  }

  private formatLifeIndices(
    indices: WeatherIndex,
  ): { key: string; name: string; level: string; description: string }[] {
    return Object.entries(indices)
      .filter(([, value]) => value?.name && value?.info && value?.detail)
      .map(([key, value]) => ({
        key,
        name: value.name,
        level: value.info,
        description: value.detail,
      }))
  }

  private formatWeatherText(result: any): string {
    const lines: string[] = []

    // Header with location
    lines.push(`📍 ${result.location.name}`)

    // Current weather - compact format
    const w = result.weather
    lines.push(`🌡️ ${w.condition} ${w.temperature}°C`)
    lines.push(`💨 ${w.humidity}% 🌬️ ${w.wind_direction}${w.wind_power}`)

    // Air quality - simplified
    if (result.air_quality) {
      const aq = result.air_quality
      const aqiEmoji = aq.aqi <= 50 ? '😊' : aq.aqi <= 100 ? '😐' : '😷'
      lines.push(`${aqiEmoji} AQI ${aq.aqi} PM2.5:${aq.pm25}`)
    }

    // Sunrise/sunset - compact
    if (result.sunrise) {
      lines.push(`🌅 ${result.sunrise.sunrise_desc} 🌇 ${result.sunrise.sunset_desc}`)
    }

    // Key life indices - only show important ones
    if (result.life_indices && result.life_indices.length > 0) {
      const important = result.life_indices
        .filter((idx: any) => ['穿衣指数', '运动指数', '洗车指数', '紫外线指数'].includes(idx.name))
        .slice(0, 2)
      important.forEach((idx: any) => {
        const emoji = idx.name.includes('穿衣')
          ? '👕'
          : idx.name.includes('运动')
            ? '🏃'
            : idx.name.includes('洗车')
              ? '🚗'
              : '☀️'
        lines.push(`${emoji} ${idx.name}:${idx.level}`)
      })
    }

    // Alerts - compact
    if (result.alerts && result.alerts.length > 0) {
      result.alerts.forEach((alert: any) => {
        lines.push(`⚠️ ${alert.type}${alert.level}`)
      })
    }

    return lines.join('\n')
  }

  private formatForecastText(result: any): string {
    const lines: string[] = []

    // Header
    lines.push(`📍 ${result.location.name} 🔮 预报`)

    // Today's hourly (next 6 hours)
    if (result.hourly_forecast && result.hourly_forecast.length > 0) {
      lines.push('🕰️ 今日逐时:')
      result.hourly_forecast.slice(0, 6).forEach((hour: any) => {
        const time = hour.datetime.split(' ')[1].slice(0, 5)
        lines.push(`${time} ${hour.condition} ${hour.temperature}°`)
      })
    }

    // Daily forecast - very compact
    if (result.daily_forecast && result.daily_forecast.length > 0) {
      lines.push('\n📅 未来几日:')
      result.daily_forecast.forEach((day: any) => {
        const date = day.date.slice(-2) + '日'
        const temp = `${day.min_temperature}-${day.max_temperature}°`
        const aqi = day.aqi <= 50 ? '😊' : day.aqi <= 100 ? '😐' : '😷'
        lines.push(`${date} ${day.day_condition} ${temp} ${aqi}${day.aqi}`)
      })
    }

    return lines.join('\n')
  }

  private formatWeatherMarkdown(result: any): string {
    const sections: string[] = []

    // Header
    sections.push(`# 🌤️ ${result.location.name} 天气`)

    // Current weather
    const w = result.weather
    sections.push(`## 当前天气\n\n**${w.condition}** ${w.temperature}°C\n\n- 💧 **湿度**: ${w.humidity}%\n- 🌬️ **风向风力**: ${w.wind_direction} ${w.wind_power}\n- 🌡️ **气压**: ${w.pressure}hPa\n- 🌧️ **降水量**: ${w.precipitation}mm\n\n*更新时间: ${w.updated}*`)

    // Air quality
    if (result.air_quality) {
      const aq = result.air_quality
      const aqiEmoji = aq.aqi <= 50 ? '😊' : aq.aqi <= 100 ? '😐' : aq.aqi <= 150 ? '😟' : aq.aqi <= 200 ? '😷' : '🤢'
      sections.push(`## 空气质量 ${aqiEmoji}\n\n**${aq.quality}** AQI: **${aq.aqi}** (全国排名 ${aq.rank}/${aq.total_cities})\n\n| 指标 | 数值 |\n|------|------|\n| PM2.5 | ${aq.pm25} μg/m³ |\n| PM10 | ${aq.pm10} μg/m³ |\n| NO₂ | ${aq.no2} μg/m³ |\n| SO₂ | ${aq.so2} μg/m³ |\n| O₃ | ${aq.o3} μg/m³ |\n| CO | ${aq.co} mg/m³ |\n\n*更新时间: ${aq.updated}*`)
    }

    // Sunrise/sunset
    if (result.sunrise) {
      sections.push(`## 日出日落 🌅\n\n- 🌄 **日出**: ${result.sunrise.sunrise_desc}\n- 🌆 **日落**: ${result.sunrise.sunset_desc}`)
    }

    // Life indices
    if (result.life_indices && result.life_indices.length > 0) {
      sections.push(`## 生活指数\n\n${result.life_indices.map((idx: any) => `### ${idx.name}\n\n**${idx.level}**\n\n${idx.description}`).join('\n\n')}`)
    }

    // Alerts
    if (result.alerts && result.alerts.length > 0) {
      sections.push(`## ⚠️ 预警信息\n\n${result.alerts.map((alert: any) => `### ${alert.type} ${alert.level}\n\n**地区**: ${alert.province} ${alert.city} ${alert.county}\n\n${alert.detail}\n\n*发布时间: ${alert.updated}*`).join('\n\n---\n\n')}`)
    }

    return sections.join('\n\n')
  }

  private formatForecastMarkdown(result: any): string {
    const sections: string[] = []

    // Header
    sections.push(`# 🔮 ${result.location.name} 天气预报`)

    // Hourly forecast
    if (result.hourly_forecast && result.hourly_forecast.length > 0) {
      sections.push(`## 逐小时预报\n\n| 时间 | 天气 | 温度 | 风向风力 |\n|------|------|------|----------|\n${result.hourly_forecast.slice(0, 12).map((hour: any) => `| ${hour.datetime.split(' ')[1].slice(0, 5)} | ${hour.condition} | ${hour.temperature}°C | ${hour.wind_direction}${hour.wind_power} |`).join('\n')}`)
    }

    // Daily forecast
    if (result.daily_forecast && result.daily_forecast.length > 0) {
      sections.push(`## 未来${result.daily_forecast.length}天预报\n\n${result.daily_forecast.map((day: any) => {
        const aqiEmoji = day.aqi <= 50 ? '😊' : day.aqi <= 100 ? '😐' : day.aqi <= 150 ? '😟' : '😷'
        return `### ${day.date}\n\n**白天**: ${day.day_condition} | **夜间**: ${day.night_condition}\n\n🌡️ **${day.min_temperature}°C ~ ${day.max_temperature}°C**\n\n- 💨 **白天风力**: ${day.day_wind_direction}${day.day_wind_power}\n- 🌙 **夜间风力**: ${day.night_wind_direction}${day.night_wind_power}\n- ${aqiEmoji} **空气质量**: ${day.air_quality} (AQI ${day.aqi})`
      }).join('\n\n---\n\n')}`)
    }

    // Sunrise/sunset table
    if (result.sunrise_sunset && result.sunrise_sunset.length > 0) {
      sections.push(`## 日出日落时间\n\n| 日出 🌄 | 日落 🌆 |\n|---------|----------|\n${result.sunrise_sunset.map((day: any) => `| ${day.sunrise_desc} | ${day.sunset_desc} |`).join('\n')}`)
    }

    return sections.join('\n\n')
  }
}

export const serviceWeather = new ServiceWeather()
