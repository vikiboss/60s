import { Common } from '../../common.ts'
import questionsData from './js-questions.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

interface JavaScriptQuestion {
  id: number
  question: string
  code?: string
  options: string[]
  answer: string
  explanation: string
}

class ServiceJsQuestions {
  handle(): RouterMiddleware<'/js-questions'> {
    return async (ctx) => {
      const request = ctx.request
      const id = await Common.getParam('id', request)
      
      let result: JavaScriptQuestion
      
      if (id) {
        // 获取指定ID的问题
        const questionId = parseInt(id)
        const question = questionsData.find(q => q.id === questionId)
        
        if (!question) {
          ctx.response.status = 404
          ctx.response.body = Common.buildJson(null, 404, `未找到ID为 ${questionId} 的问题`)
          return
        }
        
        result = question
      } else {
        // 随机获取问题（默认行为）
        result = Common.randomItem(questionsData)
      }
      
      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = this.formatQuestionText(result)
          break
          
        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }
  
  // 获取问题统计信息
  stats(): RouterMiddleware<'/js-questions/stats'> {
    return (ctx) => {
      const stats = {
        total: questionsData.length,
        categories: {
          with_code: questionsData.filter(q => q.code).length,
          without_code: questionsData.filter(q => !q.code).length
        },
        avg_options: Math.round(questionsData.reduce((sum, q) => sum + q.options.length, 0) / questionsData.length * 100) / 100,
        latest_id: Math.max(...questionsData.map(q => q.id))
      }
      
      ctx.response.body = Common.buildJson(stats)
    }
  }
  
  private formatQuestionText(question: JavaScriptQuestion): string {
    let text = `问题 ${question.id}: ${question.question}\n\n`
    
    if (question.code) {
      text += `代码:\n${question.code}\n\n`
    }
    
    text += '选项:\n'
    question.options.forEach(option => {
      text += `${option}\n`
    })
    
    text += `\n答案: ${question.answer}\n\n`
    text += `解释: ${question.explanation}`
    
    return text
  }
}

export const serviceJsQuestions = new ServiceJsQuestions()