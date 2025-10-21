#!/usr/bin/env node --no-warnings --experimental-transform-types
/**
 * 行业追踪API测试脚本
 * 用于验证所有行业追踪模块的API是否可用
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4398'

interface TestResult {
  name: string
  endpoint: string
  success: boolean
  error?: string
  dataCount?: number
  sampleTitle?: string
}

const tests = [
  {
    name: '掘金热门文章',
    endpoint: '/v2/industry/juejin',
  },
  {
    name: 'GitHub Trending',
    endpoint: '/v2/industry/github-trending',
  },
  {
    name: 'GitHub Trending (Python)',
    endpoint: '/v2/industry/github-trending?lang=python',
  },
  {
    name: 'AI行业资讯',
    endpoint: '/v2/industry/ai-news',
  },
  {
    name: 'V2EX热帖',
    endpoint: '/v2/industry/v2ex',
  },
]

async function testAPI(test: { name: string; endpoint: string }): Promise<TestResult> {
  const url = `${BASE_URL}${test.endpoint}`

  try {
    console.log(`\n🧪 测试: ${test.name}`)
    console.log(`   URL: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      return {
        name: test.name,
        endpoint: test.endpoint,
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()

    if (result.code !== 200) {
      return {
        name: test.name,
        endpoint: test.endpoint,
        success: false,
        error: result.message || '未知错误',
      }
    }

    const data = result.data || []
    const dataCount = Array.isArray(data) ? data.length : 0
    const sampleTitle = dataCount > 0 ? data[0].title : ''

    return {
      name: test.name,
      endpoint: test.endpoint,
      success: true,
      dataCount,
      sampleTitle,
    }
  } catch (error) {
    return {
      name: test.name,
      endpoint: test.endpoint,
      success: false,
      error: String(error),
    }
  }
}

async function main() {
  console.log('=' .repeat(60))
  console.log('🚀 行业追踪API测试')
  console.log('=' .repeat(60))
  console.log(`Base URL: ${BASE_URL}`)

  const results: TestResult[] = []

  for (const test of tests) {
    const result = await testAPI(test)
    results.push(result)

    if (result.success) {
      console.log(`   ✅ 成功: 获取 ${result.dataCount} 条数据`)
      if (result.sampleTitle) {
        console.log(`   📄 示例: ${result.sampleTitle.slice(0, 50)}...`)
      }
    } else {
      console.log(`   ❌ 失败: ${result.error}`)
    }
  }

  // 输出总结
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试总结')
  console.log('='.repeat(60))

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  console.log(`✅ 成功: ${successCount} / ${results.length}`)
  console.log(`❌ 失败: ${failCount} / ${results.length}`)

  if (failCount > 0) {
    console.log('\n失败的API:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`)
      })
  }

  console.log('\n' + '='.repeat(60))

  // 如果有失败的测试，退出码为1
  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
