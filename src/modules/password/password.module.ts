import { Common } from '../../common.ts'
import commonPasswordsData from './passwords.json' with { type: 'json' }

import type { RouterMiddleware } from '@oak/oak'

interface PasswordParams {
  length: number
  includeNumbers: boolean
  includeSymbols: boolean
  includeLowercase: boolean
  includeUppercase: boolean
  excludeSimilar: boolean
  excludeAmbiguous: boolean
}

interface PasswordResult {
  password: string
  length: number
  config: {
    include_numbers: boolean
    include_symbols: boolean
    include_lowercase: boolean
    include_uppercase: boolean
    exclude_similar: boolean
    exclude_ambiguous: boolean
  }
  character_sets: {
    lowercase: string
    uppercase: string
    numbers: string
    symbols: string
    used_sets: string[]
  }
  generation_info: {
    entropy: number
    strength: string
    time_to_crack: string
  }
}

interface PasswordStrengthResult {
  password: string
  length: number
  score: number
  strength: string
  entropy: number
  time_to_crack: string
  character_analysis: {
    has_lowercase: boolean
    has_uppercase: boolean
    has_numbers: boolean
    has_symbols: boolean
    has_repeated: boolean
    has_sequential: boolean
    character_variety: number
  }
  recommendations: string[]
  security_tips: string[]
}

class ServicePassword {
  private readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
  private readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  private readonly NUMBERS = '0123456789'
  private readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  private readonly SIMILAR_CHARS = 'il1Lo0O'
  private readonly AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;.<>'

  handle(): RouterMiddleware<'/password'> {
    return async (ctx) => {
      const length = await Common.getParam('length', ctx.request)
      const includeNumbers = await Common.getParam('numbers', ctx.request)
      const includeSymbols = await Common.getParam('symbols', ctx.request)
      const includeLowercase = await Common.getParam('lowercase', ctx.request)
      const includeUppercase = await Common.getParam('uppercase', ctx.request)
      const excludeSimilar = (await Common.getParam('exclude_similar', ctx.request)) || 'true'
      const excludeAmbiguous = (await Common.getParam('exclude_ambiguous', ctx.request)) || 'true'

      const params = this.parsePasswordParams({
        length,
        includeNumbers,
        includeSymbols,
        includeLowercase,
        includeUppercase,
        excludeSimilar,
        excludeAmbiguous,
      })

      if (!this.validateParams(params, ctx)) {
        return
      }

      const result = this.generatePassword(params)

      switch (ctx.state.encoding) {
        case 'text-detail':
          ctx.response.body = this.formatPasswordAsText(result)
          break
        case 'text':
          ctx.response.body = result.password
          break
        case 'markdown':
          ctx.response.body = this.formatPasswordAsMarkdown(result)
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }

  handleCheck(): RouterMiddleware<'/password/check'> {
    return async (ctx) => {
      const password = await Common.getParam('password', ctx.request)

      if (!password) {
        Common.requireArguments(['password'], ctx.response)
        return
      }

      if (password.length > 128) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '密码长度不能超过 128 个字符')
        return
      }

      const result = this.checkPasswordStrength(password)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = this.formatStrengthAsText(result)
          break
        case 'markdown':
          ctx.response.body = this.formatStrengthAsMarkdown(result)
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }

  private parsePasswordParams(raw: any): PasswordParams {
    return {
      length: raw.length ? Number.parseInt(raw.length) : 16,
      includeNumbers: raw.includeNumbers !== 'false' && raw.includeNumbers !== '0',
      includeSymbols: raw.includeSymbols === 'true' || raw.includeSymbols === '1',
      includeLowercase: raw.includeLowercase !== 'false' && raw.includeLowercase !== '0',
      includeUppercase: raw.includeUppercase !== 'false' && raw.includeUppercase !== '0',
      excludeSimilar: raw.excludeSimilar === 'true' || raw.excludeSimilar === '1',
      excludeAmbiguous: raw.excludeAmbiguous === 'true' || raw.excludeAmbiguous === '1',
    }
  }

  private validateParams(params: PasswordParams, ctx: any): boolean {
    if (Number.isNaN(params.length) || params.length < 4 || params.length > 128) {
      ctx.response.status = 400
      ctx.response.body = Common.buildJson(null, 400, '密码长度必须在 4-128 之间')
      return false
    }

    if (!params.includeNumbers && !params.includeSymbols && !params.includeLowercase && !params.includeUppercase) {
      ctx.response.status = 400
      ctx.response.body = Common.buildJson(null, 400, '至少需要包含一种字符类型（数字、符号、小写字母、大写字母）')
      return false
    }

    return true
  }

  private generatePassword(params: PasswordParams): PasswordResult {
    let charset = ''
    const usedSets: string[] = []

    let lowercase = this.LOWERCASE
    let uppercase = this.UPPERCASE
    let numbers = this.NUMBERS
    let symbols = this.SYMBOLS

    if (params.excludeSimilar) {
      lowercase = this.removeChars(lowercase, this.SIMILAR_CHARS)
      uppercase = this.removeChars(uppercase, this.SIMILAR_CHARS)
      numbers = this.removeChars(numbers, this.SIMILAR_CHARS)
      symbols = this.removeChars(symbols, this.SIMILAR_CHARS)
    }

    if (params.excludeAmbiguous) {
      symbols = this.removeChars(symbols, this.AMBIGUOUS_CHARS)
    }

    if (params.includeLowercase) {
      charset += lowercase
      usedSets.push('lowercase')
    }
    if (params.includeUppercase) {
      charset += uppercase
      usedSets.push('uppercase')
    }
    if (params.includeNumbers) {
      charset += numbers
      usedSets.push('numbers')
    }
    if (params.includeSymbols) {
      charset += symbols
      usedSets.push('symbols')
    }

    let password = ''

    if (usedSets.length > 1 && params.length >= usedSets.length) {
      if (params.includeLowercase) password += this.getRandomChar(lowercase)
      if (params.includeUppercase) password += this.getRandomChar(uppercase)
      if (params.includeNumbers) password += this.getRandomChar(numbers)
      if (params.includeSymbols) password += this.getRandomChar(symbols)

      for (let i = password.length; i < params.length; i++) {
        password += this.getRandomChar(charset)
      }

      password = this.shuffleString(password)
    } else {
      for (let i = 0; i < params.length; i++) {
        password += this.getRandomChar(charset)
      }
    }

    const entropy = this.calculateEntropy(password, charset.length)
    const strength = this.getPasswordStrength(entropy)
    const timeToCrack = this.getTimeToCrack(entropy)

    return {
      password,
      length: password.length,
      config: {
        include_numbers: params.includeNumbers,
        include_symbols: params.includeSymbols,
        include_lowercase: params.includeLowercase,
        include_uppercase: params.includeUppercase,
        exclude_similar: params.excludeSimilar,
        exclude_ambiguous: params.excludeAmbiguous,
      },
      character_sets: {
        lowercase: params.includeLowercase ? lowercase : '',
        uppercase: params.includeUppercase ? uppercase : '',
        numbers: params.includeNumbers ? numbers : '',
        symbols: params.includeSymbols ? symbols : '',
        used_sets: usedSets,
      },
      generation_info: {
        entropy,
        strength: strength.level,
        time_to_crack: timeToCrack.time,
      },
    }
  }

  private checkPasswordStrength(password: string): PasswordStrengthResult {
    const length = password.length
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSymbols = /[^a-zA-Z0-9]/.test(password)
    const hasRepeated = this.hasRepeatedChars(password)
    const hasSequential = this.hasSequentialChars(password)

    let characterVariety = 0
    if (hasLowercase) characterVariety += 26
    if (hasUppercase) characterVariety += 26
    if (hasNumbers) characterVariety += 10
    if (hasSymbols) characterVariety += 32

    const entropy = this.calculateEntropy(password, characterVariety)
    let score = this.calculatePasswordScore({
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      hasRepeated,
      hasSequential,
      length,
    })

    if (hasRepeated) score -= 10
    if (hasSequential) score -= 15
    if (this.isCommonPassword(password)) score -= 20

    score = Math.max(0, Math.min(100, score))

    const strength = this.getStrengthFromScore(score)
    const timeToCrack = this.getTimeToCrack(entropy)
    const recommendations = this.getPasswordRecommendations(password, {
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      hasRepeated,
      hasSequential,
      length,
      score,
    })

    return {
      password,
      length,
      score,
      strength: strength.level,
      entropy,
      time_to_crack: timeToCrack.time,
      character_analysis: {
        has_lowercase: hasLowercase,
        has_uppercase: hasUppercase,
        has_numbers: hasNumbers,
        has_symbols: hasSymbols,
        has_repeated: hasRepeated,
        has_sequential: hasSequential,
        character_variety: characterVariety,
      },
      recommendations,
      security_tips: this.getSecurityTips(),
    }
  }

  private removeChars(source: string, toRemove: string): string {
    return source
      .split('')
      .filter((char) => !toRemove.includes(char))
      .join('')
  }

  private getRandomChar(charset: string): string {
    return charset[Math.floor(Math.random() * charset.length)]
  }

  private shuffleString(str: string): string {
    return str
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')
  }

  private calculateEntropy(password: string, charsetSize: number): number {
    if (charsetSize === 0) return 0
    return Math.round(password.length * Math.log2(charsetSize) * 100) / 100
  }

  private getPasswordStrength(entropy: number) {
    if (entropy < 30) {
      return { level: '极弱', description: '密码强度极低，极易被破解' }
    } else if (entropy < 40) {
      return { level: '弱', description: '密码强度较低，容易被破解' }
    } else if (entropy < 50) {
      return { level: '中等', description: '密码强度中等，有一定安全性' }
    } else if (entropy < 60) {
      return { level: '强', description: '密码强度较高，具有良好安全性' }
    } else {
      return { level: '极强', description: '密码强度极高，具有优秀安全性' }
    }
  }

  private getTimeToCrack(entropy: number) {
    const combinations = Math.pow(2, entropy)
    const attemptsPerSecond = 1000000000 // 10亿次/秒的暴力破解速度
    const secondsToCrack = combinations / (2 * attemptsPerSecond) // 平均破解时间

    if (secondsToCrack < 1) {
      return { time: '< 1秒', description: '暴力破解所需时间（估算）' }
    } else if (secondsToCrack < 60) {
      return { time: `${Math.round(secondsToCrack)}秒`, description: '暴力破解所需时间（估算）' }
    } else if (secondsToCrack < 3600) {
      return { time: `${Math.round(secondsToCrack / 60)}分钟`, description: '暴力破解所需时间（估算）' }
    } else if (secondsToCrack < 86400) {
      return { time: `${Math.round(secondsToCrack / 3600)}小时`, description: '暴力破解所需时间（估算）' }
    } else if (secondsToCrack < 31536000) {
      return { time: `${Math.round(secondsToCrack / 86400)}天`, description: '暴力破解所需时间（估算）' }
    } else if (secondsToCrack < 31536000000) {
      return { time: `${Math.round(secondsToCrack / 31536000)}年`, description: '暴力破解所需时间（估算）' }
    } else {
      return { time: '数百万年', description: '暴力破解所需时间（估算）' }
    }
  }

  private hasRepeatedChars(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return true
      }
    }
    return false
  }

  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ]

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const subSeq = seq.substring(i, i + 3)
        if (password.includes(subSeq) || password.includes(subSeq.split('').reverse().join(''))) {
          return true
        }
      }
    }
    return false
  }

  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase()

    return (
      commonPasswordsData.keyboard_patterns.some(
        (pattern) => lowerPassword.includes(pattern) || pattern.includes(lowerPassword),
      ) ||
      commonPasswordsData.common_passwords.includes(lowerPassword) ||
      commonPasswordsData.chinese_common_passwords.includes(lowerPassword) ||
      commonPasswordsData.common_names.includes(lowerPassword) ||
      commonPasswordsData.common_words.includes(lowerPassword)
    )
  }

  private calculatePasswordScore(analysis: {
    hasLowercase: boolean
    hasUppercase: boolean
    hasNumbers: boolean
    hasSymbols: boolean
    hasRepeated: boolean
    hasSequential: boolean
    length: number
  }): number {
    let score = 0

    score += analysis.length * 4

    if (analysis.hasLowercase) score += 2
    if (analysis.hasUppercase) score += 2
    if (analysis.hasNumbers) score += 4
    if (analysis.hasSymbols) score += 6

    const varietyCount = [
      analysis.hasLowercase,
      analysis.hasUppercase,
      analysis.hasNumbers,
      analysis.hasSymbols,
    ].filter(Boolean).length
    score += varietyCount * 2

    if (analysis.length >= 8) score += 5
    if (analysis.length >= 12) score += 5
    if (analysis.length >= 16) score += 5

    return score
  }

  private getStrengthFromScore(score: number) {
    if (score < 30) {
      return { level: '极弱', description: '密码过于简单，需要立即改进' }
    } else if (score < 50) {
      return { level: '弱', description: '密码强度不足，建议增强' }
    } else if (score < 70) {
      return { level: '中等', description: '密码强度一般，可以进一步改进' }
    } else if (score < 85) {
      return { level: '强', description: '密码强度良好' }
    } else {
      return { level: '极强', description: '密码强度优秀' }
    }
  }

  private getPasswordRecommendations(
    password: string,
    analysis: {
      hasLowercase: boolean
      hasUppercase: boolean
      hasNumbers: boolean
      hasSymbols: boolean
      hasRepeated: boolean
      hasSequential: boolean
      length: number
      score: number
    },
  ): string[] {
    const recommendations: string[] = []

    if (analysis.length < 8) {
      recommendations.push('建议密码长度至少 8 位')
    } else if (analysis.length < 12) {
      recommendations.push('建议密码长度至少 12 位以获得更好安全性')
    }

    if (!analysis.hasLowercase) {
      recommendations.push('建议包含小写字母')
    }
    if (!analysis.hasUppercase) {
      recommendations.push('建议包含大写字母')
    }
    if (!analysis.hasNumbers) {
      recommendations.push('建议包含数字')
    }
    if (!analysis.hasSymbols) {
      recommendations.push('建议包含特殊符号')
    }

    if (analysis.hasRepeated) {
      recommendations.push('避免连续重复字符')
    }
    if (analysis.hasSequential) {
      recommendations.push('避免使用连续序列字符')
    }

    if (this.isCommonPassword(password)) {
      recommendations.push('避免使用常见密码')
    }

    if (analysis.score >= 85) {
      recommendations.push('密码强度已经很好！')
    }

    return recommendations
  }

  private getSecurityTips(): string[] {
    return [
      '使用密码管理器生成和存储复杂密码',
      '为不同账户使用不同的密码',
      '定期更换重要账户的密码',
      '启用双因素认证（2FA）增强安全性',
      '避免在公共场合输入密码',
      '不要将密码保存在浏览器中（除非使用可信的密码管理器）',
      '避免使用个人信息作为密码',
      '长密码比复杂密码更安全',
    ]
  }

  private formatPasswordAsText(result: PasswordResult): string {
    const usedSets = result.character_sets.used_sets.map((set) => {
      switch (set) {
        case 'lowercase':
          return '小写字母'
        case 'uppercase':
          return '大写字母'
        case 'numbers':
          return '数字'
        case 'symbols':
          return '特殊符号'
        default:
          return set
      }
    })

    return `
🔐 ✨ 随机密码生成 ✨ 🔐

🔑 生成的密码: ${result.password}

📊 密码信息:
• 长度: ${result.length} 位
• 字符类型: ${usedSets.join('、')}
• 熵值: ${result.generation_info.entropy} bits
• 强度: ${result.generation_info.strength}

⏱️ 破解时间: ${result.generation_info.time_to_crack}

⚙️ 生成配置:
• 包含数字: ${result.config.include_numbers ? '是' : '否'}
• 包含符号: ${result.config.include_symbols ? '是' : '否'}
• 包含小写: ${result.config.include_lowercase ? '是' : '否'}
• 包含大写: ${result.config.include_uppercase ? '是' : '否'}
• 排除相似字符: ${result.config.exclude_similar ? '是' : '否'}
• 排除模糊字符: ${result.config.exclude_ambiguous ? '是' : '否'}
    `.trim()
  }

  private formatStrengthAsText(result: PasswordStrengthResult): string {
    const recommendations =
      result.recommendations.length > 0
        ? result.recommendations
            .slice(0, 3)
            .map((r) => `• ${r}`)
            .join('\n')
        : '• 密码强度已经很好！'

    const tips = result.security_tips
      .slice(0, 3)
      .map((t) => `• ${t}`)
      .join('\n')

    return `
🛡️ ✨ 密码强度检测 ✨ 🛡️

🔍 检测密码: ${result.password}

📊 强度评估:
• 评分: ${result.score}/100
• 强度: ${result.strength}
• 熵值: ${result.entropy} bits
• 长度: ${result.length} 位

⏱️ 破解时间: ${result.time_to_crack}

🔍 字符分析:
• 小写字母: ${result.character_analysis.has_lowercase ? '✅' : '❌'}
• 大写字母: ${result.character_analysis.has_uppercase ? '✅' : '❌'}
• 数字: ${result.character_analysis.has_numbers ? '✅' : '❌'}
• 特殊符号: ${result.character_analysis.has_symbols ? '✅' : '❌'}
• 重复字符: ${result.character_analysis.has_repeated ? '⚠️ 有' : '✅ 无'}
• 连续字符: ${result.character_analysis.has_sequential ? '⚠️ 有' : '✅ 无'}

📝 改进建议:
${recommendations}

🔒 安全提示:
${tips}
    `.trim()
  }

  private formatPasswordAsMarkdown(result: PasswordResult): string {
    const usedSets = result.character_sets.used_sets
      .map((set) => {
        switch (set) {
          case 'lowercase':
            return '小写字母'
          case 'uppercase':
            return '大写字母'
          case 'numbers':
            return '数字'
          case 'symbols':
            return '特殊符号'
          default:
            return set
        }
      })
      .join('、')

    return `# 🔐 随机密码生成

## 生成的密码

\`\`\`
${result.password}
\`\`\`

## 📊 密码信息

- **长度**: ${result.length} 位
- **字符类型**: ${usedSets}
- **熵值**: ${result.generation_info.entropy} bits
- **强度**: ${result.generation_info.strength}

## ⏱️ 破解时间

${result.generation_info.time_to_crack}

## ⚙️ 生成配置

| 配置项 | 状态 |
|--------|------|
| 包含数字 | ${result.config.include_numbers ? '✅' : '❌'} |
| 包含符号 | ${result.config.include_symbols ? '✅' : '❌'} |
| 包含小写 | ${result.config.include_lowercase ? '✅' : '❌'} |
| 包含大写 | ${result.config.include_uppercase ? '✅' : '❌'} |
| 排除相似字符 | ${result.config.exclude_similar ? '✅' : '❌'} |
| 排除模糊字符 | ${result.config.exclude_ambiguous ? '✅' : '❌'} |`
  }

  private formatStrengthAsMarkdown(result: PasswordStrengthResult): string {
    const recommendations =
      result.recommendations.length > 0
        ? result.recommendations.map((r) => `- ${r}`).join('\n')
        : '- 密码强度已经很好！'

    const tips = result.security_tips.slice(0, 5).map((t) => `- ${t}`).join('\n')

    return `# 🛡️ 密码强度检测

## 检测结果

**评分**: ${result.score}/100 | **强度**: ${result.strength}

**熵值**: ${result.entropy} bits

**破解时间**: ${result.time_to_crack}

## 🔍 字符分析

| 类型 | 状态 |
|------|------|
| 小写字母 | ${result.character_analysis.has_lowercase ? '✅' : '❌'} |
| 大写字母 | ${result.character_analysis.has_uppercase ? '✅' : '❌'} |
| 数字 | ${result.character_analysis.has_numbers ? '✅' : '❌'} |
| 特殊符号 | ${result.character_analysis.has_symbols ? '✅' : '❌'} |
| 重复字符 | ${result.character_analysis.has_repeated ? '⚠️ 有' : '✅ 无'} |
| 连续字符 | ${result.character_analysis.has_sequential ? '⚠️ 有' : '✅ 无'} |

**字符种类数**: ${result.character_analysis.character_variety}

## 📝 改进建议

${recommendations}

## 🔒 安全提示

${tips}`
  }
}

export const servicePassword = new ServicePassword()
