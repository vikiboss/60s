import fs from 'fs'
import got from 'got'
import xlsx from 'xlsx'

const res = await got.post('https://www.ceic.ac.cn/daochu/id:0', {
  body: `start=1900-01-01&end=${new Date().toISOString().slice(0, 10)}`,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})

const headerMapping = {
  发震时刻: 'time',
  '震级(M)': 'magnitude',
  '纬度(°)': 'latitude',
  '经度(°)': 'longitude',
  '深度(千米)': 'depth',
  参考位置: 'location'
}

const workbook = xlsx.read(Buffer.from(res.body), { type: 'buffer' })
const worksheet = workbook.Sheets[workbook.SheetNames[0]]
const rawHeaders = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0]
const mappedHeaders = rawHeaders.map(header => headerMapping[header] || header)
const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: mappedHeaders, range: 1 })

fs.writeFileSync('../src/services/seism/seism-list.json', JSON.stringify(jsonData))

console.log('Conversion complete.')
