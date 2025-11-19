import { load } from 'cheerio'
import { Common, dayjs, TZ_SHANGHAI } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

interface MetalPrice {
  name: string
  sell_price: string
  today_price: string
  high_price: string
  low_price: string
  unit: string
}

interface GoldStorePrice {
  brand: string
  product: string
  price: string
  unit: string
  formatted: string
  updated: string
  updated_at: number
}

interface BankGoldPrice {
  bank: string
  product: string
  price: string
  unit: string
  formatted: string
  time: string
  updated: string
  updated_at: number
}

interface RecycleGoldPrice {
  type: string
  price: string
  unit: string
  formatted: string
  purity: string
  updated: string
  updated_at: number
}

interface GoldPriceData {
  date: string
  metals: MetalPrice[]
  stores: GoldStorePrice[]
  banks: BankGoldPrice[]
  recycle: RecycleGoldPrice[]
}

const METAL_CONFIGS = [
  { name: '今日金价', start: 1 },
  { name: '黄金价格', start: 1 },
  { name: '黄金_9999', start: 17 },
  { name: '黄金_T+D', start: 21 },
  { name: '伦敦金(现货黄金)', start: 57 },
  { name: '纽约黄金(美国)', start: 33 },
  { name: '白银价格', start: 5 },
  { name: '铂金价格', start: 9 },
  { name: '钯金价格', start: 13 },
] as const

const UNIT_MAP: Record<string, string> = {
  今日金价: '元/克',
  黄金价格: '元/克',
  黄金_9999: '元/克',
  '黄金_T+D': '元/克',
  '伦敦金(现货黄金)': '美元/盎司',
  '纽约黄金(美国)': '美元/盎司',
  白银价格: '元/克',
  铂金价格: '元/克',
  钯金价格: '元/克',
}

export class GoldPriceService {
  async #fetchMetals(): Promise<MetalPrice[]> {
    const response = await fetch(`http://res.huangjinjiage.com.cn/panjia1.js?t=${Date.now()}`, {
      headers: { 'User-Agent': Common.chromeUA },
    })

    const text = await response.text()
    const match = /panjia\s*=\s*"(?<listStr>[^"]+)"/.exec(text)
    if (!match) throw new Error('金价数据解析失败')

    const list = match.groups?.listStr?.split(',') || []
    const now = dayjs().tz(TZ_SHANGHAI)

    return METAL_CONFIGS.map(({ name, start }) => ({
      name,
      sell_price: list[start] ?? 'N/A',
      today_price: list[start + 1] ?? 'N/A',
      high_price: list[start + 2] ?? 'N/A',
      low_price: list[start + 3] ?? 'N/A',
      unit: UNIT_MAP[name],
      updated: now.format('YYYY-MM-DD HH:mm:ss'),
      updated_at: now.valueOf(),
    }))
  }

  async #fetchHTML(): Promise<{
    stores: GoldStorePrice[]
    banks: BankGoldPrice[]
    recycle: RecycleGoldPrice[]
  }> {
    const response = await fetch('http://www.huangjinjiage.cn/jinrijinjia.html', {
      headers: { 'User-Agent': Common.chromeUA },
    })

    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gb2312')
    const html = decoder.decode(buffer)
    const $ = load(html)

    // 清理文本：去除多余的空白字符和换行符
    const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim().replace(' 元/克', '元/克')
    const todayDate = dayjs().tz(TZ_SHANGHAI).startOf('day')

    // 解析金店今日金价
    const stores: GoldStorePrice[] = []
    const storeTable = $('h2:contains("各大金店今日金价")').parent().next().find('table tbody tr')

    storeTable.each((_, row) => {
      const tds = $(row).find('td')
      if (tds.length >= 4) {
        stores.push({
          brand: cleanText($(tds[0]).text()),
          product: cleanText($(tds[1]).text()).replace(/价格/, ''),
          price: cleanText($(tds[2]).text()).replace('元/克', '').trim(),
          unit: '元/克',
          formatted: cleanText($(tds[2]).text()),
          updated: todayDate.format('YYYY-MM-DD'),
          updated_at: todayDate.valueOf(),
        })
      }
    })

    // 解析银行金条今日金价
    const banks: BankGoldPrice[] = []
    const bankTable = $('h2:contains("银行金条今日金价")').parent().next().find('table tbody tr')

    bankTable.each((_, row) => {
      const tds = $(row).find('td')

      if (tds.length >= 4) {
        const time = cleanText($(tds[3]).text())
        const date = dayjs().tz(TZ_SHANGHAI)
        const [hour, minute, second] = time.split(':').map(Number)
        const bankTime = date.hour(hour).minute(minute).second(second)

        banks.push({
          bank: cleanText($(tds[0]).text()),
          product: cleanText($(tds[1]).text()).replace(/价格/, ''),
          price: cleanText($(tds[2]).text()).replace('元/克', '').trim(),
          unit: '元/克',
          formatted: cleanText($(tds[2]).text()),
          time,
          updated: bankTime.format('YYYY-MM-DD HH:mm:ss'),
          updated_at: bankTime.valueOf(),
        })
      }
    })

    // 解析黄金回收今日金价
    const recycle: RecycleGoldPrice[] = []
    const recycleTable = $('h2:contains("黄金回收今日金价")').parent().next().find('table tbody tr')

    recycleTable.each((_, row) => {
      const tds = $(row).find('td')

      if (tds.length >= 4) {
        recycle.push({
          type: cleanText($(tds[0]).text()).replace(/价格/, ''),
          price: cleanText($(tds[1]).text()).replace('元/克', '').trim(),
          unit: '元/克',
          formatted: cleanText($(tds[1]).text()),
          purity: cleanText($(tds[2]).text()),
          updated: todayDate.format('YYYY-MM-DD'),
          updated_at: todayDate.valueOf(),
        })
      }
    })

    return {
      stores,
      banks,
      recycle,
    }
  }

  async #fetch(): Promise<GoldPriceData> {
    const [metals, htmlData] = await Promise.all([this.#fetchMetals(), this.#fetchHTML()])

    return {
      date: dayjs().tz(TZ_SHANGHAI).format('YYYY-MM-DD'),
      metals,
      stores: htmlData.stores,
      banks: htmlData.banks,
      recycle: htmlData.recycle,
    }
  }

  handle(): RouterMiddleware<'/gold-price'> {
    return async (ctx) => {
      const data = await this.#fetch()
      const encoding = ctx.state.encoding as string | undefined

      switch (encoding) {
        case 'text': {
          const metalTexts = data.metals
            .map((metal) => `${metal.name}: ${metal.sell_price}${UNIT_MAP[metal.name]}`)
            .join('\n')

          const storeTexts = data.stores.map((store) => `${store.brand}: ${store.price}`).join('\n')
          const bankTexts = data.banks.map((bank) => `${bank.bank}: ${bank.price}`).join('\n')
          const recycleTexts = data.recycle.map((item) => `${item.type}: ${item.price}`).join('\n')

          ctx.response.body = `贵金属价格 (${dayjs().tz(TZ_SHANGHAI).format('YYYY-MM-DD HH:mm:ss')})

〓 实时行情 〓
${metalTexts}

〓 各大金店今日金价 〓
${storeTexts}

〓 银行金条今日金价 〓
${bankTexts}

〓 黄金回收今日金价 〓
${recycleTexts}`
          break
        }

        case 'markdown': {
          const metalRows = data.metals
            .map(
              (metal) =>
                `| ${metal.name} | ${metal.sell_price} | ${metal.today_price} | ${metal.high_price} | ${metal.low_price} |`,
            )
            .join('\n')

          const storeRows = data.stores
            .map((store) => `| ${store.brand} | ${store.product} | ${store.price} | ${store.updated} |`)
            .join('\n')

          const bankRows = data.banks
            .map((bank) => `| ${bank.bank} | ${bank.product} | ${bank.price} | ${bank.updated} |`)
            .join('\n')

          const recycleRows = data.recycle
            .map((item) => `| ${item.type} | ${item.price} | ${item.purity} | ${item.updated} |`)
            .join('\n')

          ctx.response.body = `# 贵金属价格

**更新时间**: ${dayjs().tz(TZ_SHANGHAI).format('YYYY-MM-DD HH:mm:ss')}

## 实时行情

| 品种 | 卖出价 | 今日价 | 最高价 | 最低价 |
|------|--------|--------|--------|--------|
${metalRows}

## 各大金店今日金价

| 黄金品牌 | 黄金品种 | 今日价格 | 报价时间 |
|----------|----------|----------|----------|
${storeRows}

## 银行金条今日金价

| 金条品牌 | 金条品种 | 今日价格 | 报价时间 |
|----------|----------|----------|----------|
${bankRows}

## 黄金回收今日金价

| 黄金种类 | 回收价格 | 黄金纯度 | 报价时间 |
|----------|----------|----------|----------|
${recycleRows}`
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
}
