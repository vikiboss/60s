const url = 'https://api.coolapk.com/v6/page/dataList?url=%23%2Ftopic%2FtagList'

const headers = {
  'X-Requested-With': 'XMLHttpRequest',
  'X-App-Id': 'com.coolapk.market',
  'X-App-Token': 'v3JDJ5JDEwJE5qaGpOMk0xTlRrdk1HRmpOVE13TmVLY203MlBIMG1vNWUxaWdUd2J1aXpQZ21GYWliSW5D',
  'X-App-Version': '15.5.1',
  'X-Api-Version': '15',
  'X-App-Device':
    '0UzMjlTZ1MWZyYDNlVTM3AyOzlXZr1CdzVGdgEDMw4CNxETMyIjLxE1SUByODhDRBJVO0AzMyAyOp1GZlJFI7kWbvFWaYByOgsDI7AyOhV2TqNXYVdWR3cXQ6hjZYNTWORkY5IXajZzbOl0bfpkaIVFR',
  'X-App-Supported': '2508251',
}

async function getCoolApkData(): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()
    console.log(text)
  } catch (error) {
    console.error('Error:', error)
  }
}

getCoolApkData()
