import fs from 'node:fs'

interface JavaScriptQuestion {
  id: number
  question: string
  code?: string
  options: string[]
  answer: string
  explanation: string
}

async function fetchMarkdown(): Promise<string> {
  const response = await fetch(
    'https://raw.githubusercontent.com/lydiahallie/javascript-questions/refs/heads/master/zh-CN/README-zh_CN.md',
  )
  return await response.text()
}

function parseQuestions(markdown: string): JavaScriptQuestion[] {
  const questions: JavaScriptQuestion[] = []

  // 分割markdown为问题块
  const questionBlocks = markdown.split(/######\s+(\d+)\.\s+/)

  // 跳过第一个元素（header部分）
  for (let i = 1; i < questionBlocks.length; i += 2) {
    const questionNumber = parseInt(questionBlocks[i])
    const content = questionBlocks[i + 1]

    if (!content) continue

    try {
      const question = parseQuestionBlock(questionNumber, content)
      if (question) {
        questions.push(question)
      }
    } catch (error) {
      console.warn(`Failed to parse question ${questionNumber}:`, error)
    }
  }

  return questions
}

function parseQuestionBlock(id: number, content: string): JavaScriptQuestion | null {
  const lines = content.trim().split('\n')

  // 提取问题标题
  const questionMatch = lines[0]?.match(/^(.+?)$/)
  if (!questionMatch) return null

  const question = questionMatch[1].trim()

  // 查找代码块
  let code = ''
  let codeStartIndex = -1
  let codeEndIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('```javascript')) {
      codeStartIndex = i + 1
    } else if (lines[i] === '```' && codeStartIndex !== -1) {
      codeEndIndex = i
      break
    }
  }

  if (codeStartIndex !== -1 && codeEndIndex !== -1) {
    code = lines.slice(codeStartIndex, codeEndIndex).join('\n')
  }

  // 提取选项
  const options: string[] = []
  const optionRegex = /^-\s+([A-Z]):\s+(.+)$/

  for (const line of lines) {
    const match = line.match(optionRegex)
    if (match) {
      options.push(`${match[1]}: ${match[2]}`)
    }
  }

  // 提取答案和解释
  const detailsMatch = content.match(
    /<details><summary><b>答案<\/b><\/summary>\n<p>\n\n#### 答案：([A-Z])\n\n([\s\S]*?)\n\n<\/p>\n<\/details>/,
  )

  let answer = ''
  let explanation = ''

  if (detailsMatch) {
    answer = detailsMatch[1]
    explanation = detailsMatch[2]
      .trim()
      // 清理HTML标签
      .replace(/<[^>]*>/g, '')
      // 清理多余空白
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  return {
    id,
    question,
    code: code || undefined,
    options,
    answer,
    explanation,
  }
}

async function main() {
  try {
    console.log('正在获取 JavaScript 问题数据...')
    const markdown = await fetchMarkdown()

    console.log('正在解析问题...')
    const questions = parseQuestions(markdown)

    console.log(`解析完成，共 ${questions.length} 个问题`)

    // 写入JSON文件
    const outputPath = './src/modules/js-questions/js-questions.json'
    await fs.promises.writeFile(outputPath, JSON.stringify(questions, null, 2))

    console.log(`数据已保存到 ${outputPath}`)

    // 显示第一个问题作为示例
    if (questions.length > 0) {
      console.log('\n第一个问题示例:')
      console.log(JSON.stringify(questions[0], null, 2))
    }
  } catch (error) {
    console.error('处理失败:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
