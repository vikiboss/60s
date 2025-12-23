import { Common } from '../../common.ts'
import questionsData from './awesome-js.json' with { type: 'json' }

import type { AppContext } from '../../types.ts'

interface JavaScriptQuestion {
  id: number
  question: string
  code?: string
  options: string[]
  answer: string
  explanation: string
}

class ServiceAwesomeJs {
  async handle(ctx: AppContext) {
    const id = await Common.getParam('id', ctx)

    let result: JavaScriptQuestion

    if (id) {
      const questionId = Number.parseInt(id)
      const question = questionsData.find((q) => q.id === questionId)

      if (!question) {
        ctx.set.status = 404
        return Common.buildJson(null, 404, `未找到 ID 为 ${questionId} 的问题`)
      }

      result = question
    } else {
      result = Common.randomItem(questionsData)
    }

    switch (ctx.encoding) {
      case 'text':
        return this.formatQuestionText(result)

      case 'markdown':
        return this.formatQuestionMarkdown(result)

      case 'json':
      default:
        return Common.buildJson(result)
    }
  }

  private formatQuestionText(question: JavaScriptQuestion): string {
    let text = `${question.question}\n\n`

    if (question.code) {
      text += `代码:\n${question.code}\n\n`
    }

    text += '选项:\n'
    question.options.forEach((option) => {
      text += `${option}\n`
    })

    text += `\n答案: ${question.answer}\n\n`
    text += `解释: ${question.explanation}`

    return text
  }

  private formatQuestionMarkdown(question: JavaScriptQuestion): string {
    let md = `# 💻 JavaScript 面试题 #${question.id}\n\n## ${question.question}\n\n`

    if (question.code) {
      md += `\`\`\`javascript\n${question.code}\n\`\`\`\n\n`
    }

    md += `### 选项\n\n`
    question.options.forEach((option) => {
      md += `- ${option}\n`
    })

    md += `\n### ✅ 答案\n\n**${question.answer}**\n\n### 💡 解释\n\n${question.explanation}`

    return md
  }
}

export const serviceAwesomeJs = new ServiceAwesomeJs()
