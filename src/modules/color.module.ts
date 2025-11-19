import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

interface HSLColor {
  h: number
  s: number
  l: number
}

interface RGBColor {
  r: number
  g: number
  b: number
}

interface ColorPalette {
  name: string
  description: string
  colors: Array<{
    hex: string
    name: string
    role: string
    theory: string
  }>
}

class ServiceColor {
  handle(): RouterMiddleware<'/color'> {
    return async (ctx) => {
      const color = await Common.getParam('color', ctx.request)

      let hex: string

      if (color) {
        // 转换已有颜色到各种格式
        const normalizedHex = this.normalizeHex(color)

        if (!this.isValidHex(normalizedHex)) {
          ctx.response.status = 400
          ctx.response.body = Common.buildJson(
            null,
            400,
            '无效的颜色编码。请提供有效的 HEX 颜色编码，例如：#FF5733 或 FF5733',
          )
          return
        }

        hex = normalizedHex
      } else {
        // 生成随机颜色
        hex = this.generateRandomColor()
      }

      const data = this.convertColorFormats(hex)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = this.formatColorAsText(data)
          break
        case 'markdown':
          ctx.response.body = `# 🎨 颜色信息\n\n## ${data.name}\n\n<div style="background: ${data.hex}; width: 100%; height: 100px; border-radius: 8px;"></div>\n\n**HEX**: ${data.hex}\n\n**RGB**: rgb(${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b})\n\n**HSL**: hsl(${data.hsl.h}°, ${data.hsl.s}%, ${data.hsl.l}%)\n\n**CMYK**: cmyk(${data.cmyk.c}%, ${data.cmyk.m}%, ${data.cmyk.y}%, ${data.cmyk.k}%)\n\n### 互补色\n\n**${data.complementary}** - ${data.complementary}`
          break
        case 'html':
          ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8')
          ctx.response.body = this.formatColorAsHTML(data)
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  handlePalette(): RouterMiddleware<'/color/palette'> {
    return async (ctx) => {
      const hex = (await Common.getParam('color', ctx.request)) || this.generateRandomColor()

      const normalizedHex = this.normalizeHex(hex)

      if (!this.isValidHex(normalizedHex)) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(
          null,
          400,
          'color 参数不是有效的 HEX 颜色编码。请提供有效的 6 位或 3 位 HEX 编码，例如：#FF5733 或 FF5733',
        )
        return
      }

      const baseColor = this.hexToHSL(normalizedHex)
      const palettes = this.generateColorPalettes(normalizedHex, baseColor)

      const data = {
        input: {
          hex: normalizedHex,
          rgb: this.hexToRGB(normalizedHex),
          hsl: baseColor,
          name: this.getColorName(normalizedHex),
        },
        palettes: palettes,
        metadata: {
          color_theory: '基于色彩理论生成的专业配色方案',
          total_palettes: palettes.length,
          applications: ['Web 设计', 'UI/UX', '品牌设计', '室内设计', '服装搭配'],
        },
      }

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = this.formatAsText(data)
          break
        case 'markdown':
          ctx.response.body = `# 🎨 配色方案\n\n## 基础颜色\n\n**${data.input.name}** - ${data.input.hex}\n\n${data.palettes.map((p: ColorPalette) => `### ${p.name}\n\n${p.description}\n\n${p.colors.map(c => `- **${c.name}** (${c.role}) - ${c.hex}`).join('\n')}\n`).join('\n')}`
          break
        case 'html':
          ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8')
          ctx.response.body = this.formatAsHTML(data)
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  private normalizeHex(hex: string): string {
    let normalized = hex.trim().replace(/^#/, '')

    if (normalized.length === 3) {
      normalized = normalized
        .split('')
        .map((char) => char + char)
        .join('')
    }

    return '#' + normalized.toUpperCase()
  }

  private isValidHex(hex: string): boolean {
    const hexPattern = /^#[0-9A-F]{6}$/i
    return hexPattern.test(hex)
  }

  private hexToRGB(hex: string): RGBColor {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  private hexToHSL(hex: string): HSLColor {
    const { r, g, b } = this.hexToRGB(hex)
    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255

    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const delta = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6
          break
        case gNorm:
          h = ((bNorm - rNorm) / delta + 2) / 6
          break
        case bNorm:
          h = ((rNorm - gNorm) / delta + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  private HSLToHex(h: number, s: number, l: number): string {
    const hNorm = h / 360
    const sNorm = s / 100
    const lNorm = l / 100

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1))
    const m = lNorm - c / 2

    let r = 0,
      g = 0,
      b = 0

    if (0 <= hNorm && hNorm < 1 / 6) {
      r = c
      g = x
      b = 0
    } else if (1 / 6 <= hNorm && hNorm < 2 / 6) {
      r = x
      g = c
      b = 0
    } else if (2 / 6 <= hNorm && hNorm < 3 / 6) {
      r = 0
      g = c
      b = x
    } else if (3 / 6 <= hNorm && hNorm < 4 / 6) {
      r = 0
      g = x
      b = c
    } else if (4 / 6 <= hNorm && hNorm < 5 / 6) {
      r = x
      g = 0
      b = c
    } else if (5 / 6 <= hNorm && hNorm < 1) {
      r = c
      g = 0
      b = x
    }

    const rFinal = Math.round((r + m) * 255)
    const gFinal = Math.round((g + m) * 255)
    const bFinal = Math.round((b + m) * 255)

    return `#${rFinal.toString(16).padStart(2, '0').toUpperCase()}${gFinal.toString(16).padStart(2, '0').toUpperCase()}${bFinal.toString(16).padStart(2, '0').toUpperCase()}`
  }

  private generateColorPalettes(baseHex: string, baseHSL: HSLColor): ColorPalette[] {
    const palettes: ColorPalette[] = []

    // 1. 单色配色方案 (Monochromatic)
    palettes.push({
      name: '单色配色',
      description: '基于同一色相，通过调整明度和饱和度创建的和谐配色方案，适合营造统一、专业的视觉效果',
      colors: [
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex(baseHSL.h, baseHSL.s, Math.max(10, baseHSL.l - 30)),
          name: '深色变体',
          role: 'dark',
          theory: '降低明度',
        },
        {
          hex: this.HSLToHex(baseHSL.h, baseHSL.s, Math.min(90, baseHSL.l + 20)),
          name: '浅色变体',
          role: 'light',
          theory: '提高明度',
        },
        {
          hex: this.HSLToHex(baseHSL.h, Math.max(10, baseHSL.s - 20), baseHSL.l),
          name: '柔和变体',
          role: 'muted',
          theory: '降低饱和度',
        },
        {
          hex: this.HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + 15), baseHSL.l),
          name: '鲜艳变体',
          role: 'vibrant',
          theory: '提高饱和度',
        },
      ],
    })

    // 2. 互补配色方案 (Complementary)
    const complementaryHue = (baseHSL.h + 180) % 360
    palettes.push({
      name: '互补配色',
      description: '使用色轮上相对的颜色，创造强烈对比和视觉冲击力，适用于需要突出重点的设计',
      colors: [
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex(complementaryHue, baseHSL.s, baseHSL.l),
          name: '互补色',
          role: 'complementary',
          theory: '色轮对面 +180°',
        },
        {
          hex: this.HSLToHex(baseHSL.h, baseHSL.s, Math.min(90, baseHSL.l + 25)),
          name: '主色浅调',
          role: 'primary-light',
          theory: '主色提高明度',
        },
        {
          hex: this.HSLToHex(complementaryHue, baseHSL.s, Math.min(90, baseHSL.l + 25)),
          name: '互补色浅调',
          role: 'complementary-light',
          theory: '互补色提高明度',
        },
      ],
    })

    // 3. 邻近配色方案 (Analogous)
    palettes.push({
      name: '邻近配色',
      description: '使用色轮上相邻的颜色，创造自然和谐的渐变效果，常见于自然景观中',
      colors: [
        {
          hex: this.HSLToHex((baseHSL.h - 30 + 360) % 360, baseHSL.s, baseHSL.l),
          name: '邻近色1',
          role: 'analogous-1',
          theory: '色相 -30°',
        },
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex((baseHSL.h + 30) % 360, baseHSL.s, baseHSL.l),
          name: '邻近色2',
          role: 'analogous-2',
          theory: '色相 +30°',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 60) % 360, baseHSL.s, baseHSL.l),
          name: '邻近色3',
          role: 'analogous-3',
          theory: '色相 +60°',
        },
      ],
    })

    // 4. 三角配色方案 (Triadic)
    palettes.push({
      name: '三角配色',
      description: '在色轮上形成等边三角形的三种颜色，提供丰富对比的同时保持和谐平衡',
      colors: [
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex((baseHSL.h + 120) % 360, baseHSL.s, baseHSL.l),
          name: '三角色1',
          role: 'triadic-1',
          theory: '色相 +120°',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 240) % 360, baseHSL.s, baseHSL.l),
          name: '三角色2',
          role: 'triadic-2',
          theory: '色相 +240°',
        },
      ],
    })

    // 5. 分裂互补配色方案 (Split Complementary)
    palettes.push({
      name: '分裂互补配色',
      description: '使用互补色两侧的颜色，比纯互补配色更柔和，同时保持强烈的视觉对比',
      colors: [
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex((baseHSL.h + 150) % 360, baseHSL.s, baseHSL.l),
          name: '分裂互补色1',
          role: 'split-comp-1',
          theory: '互补色 -30°',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 210) % 360, baseHSL.s, baseHSL.l),
          name: '分裂互补色2',
          role: 'split-comp-2',
          theory: '互补色 +30°',
        },
      ],
    })

    // 6. 四边形配色方案 (Tetradic/Square)
    palettes.push({
      name: '四边形配色',
      description: '在色轮上形成正方形的四种颜色，提供最丰富的颜色变化，适合复杂的设计项目',
      colors: [
        { hex: baseHex, name: '主色', role: 'primary', theory: '基础色相' },
        {
          hex: this.HSLToHex((baseHSL.h + 90) % 360, baseHSL.s, baseHSL.l),
          name: '四边形色1',
          role: 'square-1',
          theory: '色相 +90°',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 180) % 360, baseHSL.s, baseHSL.l),
          name: '四边形色2',
          role: 'square-2',
          theory: '色相 +180°',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 270) % 360, baseHSL.s, baseHSL.l),
          name: '四边形色3',
          role: 'square-3',
          theory: '色相 +270°',
        },
      ],
    })

    // 7. Web 设计专用配色
    palettes.push({
      name: 'Web 设计配色',
      description: '专为 Web 界面设计优化的配色方案，考虑了可访问性和用户体验',
      colors: [
        { hex: baseHex, name: '品牌主色', role: 'brand-primary', theory: '品牌识别色' },
        {
          hex: this.HSLToHex(baseHSL.h, Math.max(10, baseHSL.s - 15), Math.max(15, baseHSL.l - 20)),
          name: '按钮悬停',
          role: 'hover-state',
          theory: '主色加深变体',
        },
        {
          hex: this.HSLToHex(baseHSL.h, Math.max(5, baseHSL.s - 25), Math.min(95, baseHSL.l + 35)),
          name: '背景浅色',
          role: 'background',
          theory: '高明度低饱和度',
        },
        {
          hex: this.HSLToHex((baseHSL.h + 180) % 360, Math.min(100, baseHSL.s + 10), Math.max(20, baseHSL.l - 10)),
          name: '强调色',
          role: 'accent',
          theory: '互补色系强调',
        },
        { hex: '#6B7280', name: '文本辅助', role: 'text-secondary', theory: '中性灰色文本' },
      ],
    })

    // 8. 暖色调配色方案
    if (this.isWarmColor(baseHSL.h)) {
      palettes.push({
        name: '暖色调配色',
        description: '基于暖色系的配色方案，营造温暖、活力和友好的氛围，适合餐饮、儿童产品等',
        colors: [
          { hex: baseHex, name: '主暖色', role: 'warm-primary', theory: '暖色系基调' },
          {
            hex: this.HSLToHex(this.constrainToWarmRange(baseHSL.h - 20), baseHSL.s, baseHSL.l),
            name: '暖色变体1',
            role: 'warm-variant-1',
            theory: '暖色范围内调整',
          },
          {
            hex: this.HSLToHex(this.constrainToWarmRange(baseHSL.h + 25), baseHSL.s, baseHSL.l),
            name: '暖色变体2',
            role: 'warm-variant-2',
            theory: '暖色范围内调整',
          },
          {
            hex: this.HSLToHex(baseHSL.h, baseHSL.s, Math.min(85, baseHSL.l + 20)),
            name: '暖色浅调',
            role: 'warm-tint',
            theory: '提高明度的暖色',
          },
        ],
      })
    }

    // 9. 冷色调配色方案
    if (this.isCoolColor(baseHSL.h)) {
      palettes.push({
        name: '冷色调配色',
        description: '基于冷色系的配色方案，传达专业、冷静和可信赖的感觉，适合科技、医疗等行业',
        colors: [
          { hex: baseHex, name: '主冷色', role: 'cool-primary', theory: '冷色系基调' },
          {
            hex: this.HSLToHex(this.constrainToCoolRange(baseHSL.h - 25), baseHSL.s, baseHSL.l),
            name: '冷色变体1',
            role: 'cool-variant-1',
            theory: '冷色范围内调整',
          },
          {
            hex: this.HSLToHex(this.constrainToCoolRange(baseHSL.h + 20), baseHSL.s, baseHSL.l),
            name: '冷色变体2',
            role: 'cool-variant-2',
            theory: '冷色范围内调整',
          },
          {
            hex: this.HSLToHex(baseHSL.h, baseHSL.s, Math.min(85, baseHSL.l + 20)),
            name: '冷色浅调',
            role: 'cool-tint',
            theory: '提高明度的冷色',
          },
        ],
      })
    }

    return palettes
  }

  private isWarmColor(hue: number): boolean {
    return (hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360)
  }

  private isCoolColor(hue: number): boolean {
    return hue >= 120 && hue <= 270
  }

  private constrainToWarmRange(hue: number): number {
    const normalizedHue = ((hue % 360) + 360) % 360
    if (normalizedHue > 60 && normalizedHue < 300) {
      return normalizedHue > 180 ? 300 : 60
    }
    return normalizedHue
  }

  private constrainToCoolRange(hue: number): number {
    const normalizedHue = ((hue % 360) + 360) % 360
    if (normalizedHue < 120 || normalizedHue > 270) {
      return normalizedHue < 120 ? 120 : 270
    }
    return normalizedHue
  }

  private getColorName(hex: string): string {
    const { r, g, b } = this.hexToRGB(hex)
    const total = r + g + b

    if (total < 100) return '深色系'
    if (total > 600) return '浅色系'

    const max = Math.max(r, g, b)
    if (max === r && r > g && r > b) return '红色系'
    if (max === g && g > r && g > b) return '绿色系'
    if (max === b && b > r && b > g) return '蓝色系'
    if (r > 200 && g > 200 && b < 100) return '黄色系'
    if (r > 200 && g < 100 && b > 200) return '品红系'
    if (r < 100 && g > 200 && b > 200) return '青色系'

    return '中性色系'
  }

  private formatAsText(data: any): string {
    let result = `🎨 色彩搭配分析报告\n\n`
    result += `输入颜色: ${data.input.hex} (${data.input.name})\n`
    result += `RGB: ${data.input.rgb.r}, ${data.input.rgb.g}, ${data.input.rgb.b}\n`
    result += `HSL: ${data.input.hsl.h}°, ${data.input.hsl.s}%, ${data.input.hsl.l}%\n\n`

    data.palettes.forEach((palette: ColorPalette, index: number) => {
      result += `${index + 1}. ${palette.name}\n`
      result += `   ${palette.description}\n\n`

      palette.colors.forEach((color) => {
        result += `   • ${color.hex} - ${color.name} (${color.theory})\n`
      })
      result += `\n`
    })

    result += `📊 配色方案数量: ${data.metadata.total_palettes}\n`
    result += `🎯 适用领域: ${data.metadata.applications.join('、')}\n`

    return result
  }

  private formatAsHTML(data: any): string {
    const styles = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          padding: 20px;
          line-height: 1.6;
        }
        .container { 
          max-width: 1200px; 
          margin: 0 auto; 
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .header h1 { 
          font-size: 2.5em; 
          margin-bottom: 10px;
          font-weight: 700;
        }
        .input-info { 
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 12px;
          margin-top: 20px;
          backdrop-filter: blur(10px);
        }
        .input-color { 
          width: 80px; 
          height: 80px; 
          border-radius: 50%; 
          display: inline-block;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          margin-right: 20px;
          vertical-align: middle;
        }
        .content { padding: 40px; }
        .palette-section { 
          margin-bottom: 50px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .palette-header { 
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 25px;
        }
        .palette-title { 
          font-size: 1.8em; 
          font-weight: 600;
          margin-bottom: 8px;
        }
        .palette-description { 
          opacity: 0.9;
          font-size: 1.1em;
        }
        .colors-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 0;
          background: #f8f9fa;
        }
        .color-card { 
          display: flex;
          flex-direction: column;
          min-height: 140px;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .color-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          z-index: 1;
        }
        .color-block { 
          height: 80px; 
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1em;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          color: white;
          position: relative;
        }
        .color-info { 
          padding: 15px;
          background: white;
          flex: 1;
        }
        .color-name { 
          font-weight: 600;
          font-size: 1.1em;
          margin-bottom: 5px;
          color: #2d3748;
        }
        .color-theory { 
          font-size: 0.9em;
          color: #718096;
          font-style: italic;
        }
        .metadata { 
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-top: 20px;
          border-radius: 12px;
        }
        .applications { 
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }
        .app-tag { 
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9em;
        }
        @media (max-width: 768px) {
          .colors-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
          .header h1 { font-size: 2em; }
          .content { padding: 20px; }
          .input-color { width: 60px; height: 60px; }
        }
      </style>
    `

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎨 色彩搭配分析 - ${data.input.hex}</title>
  ${styles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 色彩搭配分析</h1>
      <div class="input-info">
        <div class="input-color" style="background-color: ${data.input.hex}"></div>
        <div style="display: inline-block; vertical-align: middle;">
          <div style="font-size: 1.5em; font-weight: 600;">${data.input.hex}</div>
          <div style="opacity: 0.9;">${data.input.name} | RGB(${data.input.rgb.r}, ${data.input.rgb.g}, ${data.input.rgb.b}) | HSL(${data.input.hsl.h}°, ${data.input.hsl.s}%, ${data.input.hsl.l}%)</div>
        </div>
      </div>
    </div>
    
    <div class="content">`

    data.palettes.forEach((palette: ColorPalette, index: number) => {
      const gradientColors = [
        '#f093fb, #f5576c',
        '#4facfe, #00f2fe',
        '#43e97b, #38f9d7',
        '#fa709a, #fee140',
        '#a8edea, #fed6e3',
        '#ffecd2, #fcb69f',
        '#ff8a80, #ffccbc',
        '#d299c2, #fef9d7',
        '#89f7fe, #66a6ff',
      ]
      const gradient = gradientColors[index % gradientColors.length]

      html += `
      <div class="palette-section">
        <div class="palette-header" style="background: linear-gradient(135deg, ${gradient});">
          <div class="palette-title">${palette.name}</div>
          <div class="palette-description">${palette.description}</div>
        </div>
        <div class="colors-grid">`

      palette.colors.forEach((color) => {
        const brightness = this.getBrightness(color.hex)
        const textColor = brightness > 128 ? '#000000' : '#ffffff'

        html += `
          <div class="color-card">
            <div class="color-block" style="background-color: ${color.hex}; color: ${textColor};">
              ${color.hex}
            </div>
            <div class="color-info">
              <div class="color-name">${color.name}</div>
              <div class="color-theory">${color.theory}</div>
            </div>
          </div>`
      })

      html += `
        </div>
      </div>`
    })

    html += `
    </div>
    
    <div class="metadata">
      <h3>📊 分析报告</h3>
      <p><strong>${data.metadata.total_palettes}</strong> 种专业配色方案 | 基于色彩理论生成</p>
      <div class="applications">
        ${data.metadata.applications.map((app: string) => `<span class="app-tag">${app}</span>`).join('')}
      </div>
    </div>
  </div>
</body>
</html>`

    return html
  }

  private getBrightness(hex: string): number {
    const { r, g, b } = this.hexToRGB(hex)
    return (r * 299 + g * 587 + b * 114) / 1000
  }

  private generateRandomColor(): string {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)

    return `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`
  }

  private convertColorFormats(hex: string) {
    const rgb = this.hexToRGB(hex)
    const hsl = this.hexToHSL(hex)
    const colorName = this.getColorName(hex)

    return {
      hex: hex,
      name: colorName,
      rgb: {
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        string: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      },
      hsl: {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        string: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      },
      hsv: this.hexToHSV(hex),
      cmyk: this.hexToCMYK(hex),
      lab: this.hexToLAB(hex),
      brightness: this.getBrightness(hex),
      contrast: {
        white: this.getContrastRatio(hex, '#FFFFFF'),
        black: this.getContrastRatio(hex, '#000000'),
      },
      accessibility: this.getAccessibilityInfo(hex),
      complementary: this.HSLToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      analogous: [
        this.HSLToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        this.HSLToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      ],
      triadic: [this.HSLToHex((hsl.h + 120) % 360, hsl.s, hsl.l), this.HSLToHex((hsl.h + 240) % 360, hsl.s, hsl.l)],
    }
  }

  private hexToHSV(hex: string) {
    const { r, g, b } = this.hexToRGB(hex)
    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255

    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const delta = max - min

    let h = 0
    let s = 0
    const v = max

    if (delta !== 0) {
      s = delta / max
      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6
          break
        case gNorm:
          h = ((bNorm - rNorm) / delta + 2) / 6
          break
        case bNorm:
          h = ((rNorm - gNorm) / delta + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
      string: `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`,
    }
  }

  private hexToCMYK(hex: string) {
    const { r, g, b } = this.hexToRGB(hex)
    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255

    const k = 1 - Math.max(rNorm, gNorm, bNorm)
    const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k)
    const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k)
    const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k)

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
      string: `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`,
    }
  }

  private hexToLAB(hex: string) {
    // 简化的 RGB 到 LAB 转换
    const { r, g, b } = this.hexToRGB(hex)

    // 转换到 XYZ 色彩空间（简化版本）
    let rNorm = r / 255
    let gNorm = g / 255
    let bNorm = b / 255

    // 伽马校正
    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

    // 转换到 XYZ
    const x = (rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805) / 0.95047
    const y = (rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722) / 1.0
    const z = (rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505) / 1.08883

    // 转换到 LAB
    const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
    const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
    const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116

    const l = 116 * fy - 16
    const a = 500 * (fx - fy)
    const bLab = 200 * (fy - fz)

    return {
      l: Math.round(l),
      a: Math.round(a),
      b: Math.round(bLab),
      string: `lab(${Math.round(l)}, ${Math.round(a)}, ${Math.round(bLab)})`,
    }
  }

  private getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (hex: string) => {
      const { r, g, b } = this.hexToRGB(hex)
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)

    return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 100) / 100
  }

  private getAccessibilityInfo(hex: string) {
    const whiteContrast = this.getContrastRatio(hex, '#FFFFFF')
    const blackContrast = this.getContrastRatio(hex, '#000000')

    return {
      aa_normal: whiteContrast >= 4.5 || blackContrast >= 4.5,
      aa_large: whiteContrast >= 3 || blackContrast >= 3,
      aaa_normal: whiteContrast >= 7 || blackContrast >= 7,
      aaa_large: whiteContrast >= 4.5 || blackContrast >= 4.5,
      best_text_color: whiteContrast > blackContrast ? '#FFFFFF' : '#000000',
    }
  }

  private formatColorAsText(data: any): string {
    let result = `🎨 颜色信息\n\n`
    result += `颜色: ${data.hex} (${data.name})\n\n`
    result += `📊 格式转换:\n`
    result += `  HEX: ${data.hex}\n`
    result += `  RGB: ${data.rgb.string}\n`
    result += `  HSL: ${data.hsl.string}\n`
    result += `  HSV: ${data.hsv.string}\n`
    result += `  CMYK: ${data.cmyk.string}\n`
    result += `  LAB: ${data.lab.string}\n\n`
    result += `✨ 属性信息:\n`
    result += `  亮度: ${data.brightness} (0-255)\n`
    result += `  对比度 (白色): ${data.contrast.white}:1\n`
    result += `  对比度 (黑色): ${data.contrast.black}:1\n`
    result += `  最佳文字颜色: ${data.accessibility.best_text_color}\n\n`
    result += `🎯 无障碍性:\n`
    result += `  AA 普通文本: ${data.accessibility.aa_normal ? '✅' : '❌'}\n`
    result += `  AA 大文本: ${data.accessibility.aa_large ? '✅' : '❌'}\n`
    result += `  AAA 普通文本: ${data.accessibility.aaa_normal ? '✅' : '❌'}\n`
    result += `  AAA 大文本: ${data.accessibility.aaa_large ? '✅' : '❌'}\n\n`
    result += `🌈 相关颜色:\n`
    result += `  互补色: ${data.complementary}\n`
    result += `  邻近色: ${data.analogous.join(', ')}\n`
    result += `  三角色: ${data.triadic.join(', ')}\n`

    return result
  }

  private formatColorAsHTML(data: any): string {
    const styles = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
          color: #333;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: ${data.hex};
          color: ${data.accessibility.best_text_color};
          padding: 40px;
          text-align: center;
        }
        .header h1 { font-size: 3em; margin-bottom: 10px; }
        .hex-code { font-size: 2em; font-weight: 600; opacity: 0.9; }
        .color-name { font-size: 1.3em; margin-top: 10px; opacity: 0.8; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 { 
          font-size: 1.5em; 
          margin-bottom: 15px; 
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .format-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
        }
        .format-item { 
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid ${data.hex};
        }
        .format-label { font-weight: 600; color: #4a5568; }
        .format-value { font-family: monospace; color: #2d3748; }
        .color-preview { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); 
          gap: 10px; 
          margin-top: 15px;
        }
        .color-swatch { 
          height: 60px; 
          border-radius: 8px; 
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.8em;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .accessibility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .accessibility-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: #f7fafc;
          border-radius: 8px;
        }
        .status-pass { color: #38a169; }
        .status-fail { color: #e53e3e; }
        @media (max-width: 768px) {
          .format-grid { grid-template-columns: 1fr; }
          .color-preview { grid-template-columns: repeat(3, 1fr); }
          .accessibility-grid { grid-template-columns: 1fr; }
          .header { padding: 30px 20px; }
          .header h1 { font-size: 2em; }
          .hex-code { font-size: 1.5em; }
        }
      </style>
    `

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎨 颜色分析 - ${data.hex}</title>
  ${styles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨</h1>
      <div class="hex-code">${data.hex}</div>
      <div class="color-name">${data.name}</div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📊 格式转换</h2>
        <div class="format-grid">
          <div class="format-item">
            <div class="format-label">HEX</div>
            <div class="format-value">${data.hex}</div>
          </div>
          <div class="format-item">
            <div class="format-label">RGB</div>
            <div class="format-value">${data.rgb.string}</div>
          </div>
          <div class="format-item">
            <div class="format-label">HSL</div>
            <div class="format-value">${data.hsl.string}</div>
          </div>
          <div class="format-item">
            <div class="format-label">HSV</div>
            <div class="format-value">${data.hsv.string}</div>
          </div>
          <div class="format-item">
            <div class="format-label">CMYK</div>
            <div class="format-value">${data.cmyk.string}</div>
          </div>
          <div class="format-item">
            <div class="format-label">LAB</div>
            <div class="format-value">${data.lab.string}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🎯 无障碍性检查</h2>
        <div class="accessibility-grid">
          <div class="accessibility-item">
            <span>AA 普通文本</span>
            <span class="${data.accessibility.aa_normal ? 'status-pass' : 'status-fail'}">
              ${data.accessibility.aa_normal ? '✅ 通过' : '❌ 未通过'}
            </span>
          </div>
          <div class="accessibility-item">
            <span>AA 大文本</span>
            <span class="${data.accessibility.aa_large ? 'status-pass' : 'status-fail'}">
              ${data.accessibility.aa_large ? '✅ 通过' : '❌ 未通过'}
            </span>
          </div>
          <div class="accessibility-item">
            <span>AAA 普通文本</span>
            <span class="${data.accessibility.aaa_normal ? 'status-pass' : 'status-fail'}">
              ${data.accessibility.aaa_normal ? '✅ 通过' : '❌ 未通过'}
            </span>
          </div>
          <div class="accessibility-item">
            <span>AAA 大文本</span>
            <span class="${data.accessibility.aaa_large ? 'status-pass' : 'status-fail'}">
              ${data.accessibility.aaa_large ? '✅ 通过' : '❌ 未通过'}
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🌈 相关颜色</h2>
        <div class="color-preview">
          <div class="color-swatch" style="background: ${data.complementary}">
            <div>互补色<br>${data.complementary}</div>
          </div>
          ${data.analogous
            .map(
              (color: string, index: number) =>
                `<div class="color-swatch" style="background: ${color}">
              <div>邻近色${index + 1}<br>${color}</div>
            </div>`,
            )
            .join('')}
          ${data.triadic
            .map(
              (color: string, index: number) =>
                `<div class="color-swatch" style="background: ${color}">
              <div>三角色${index + 1}<br>${color}</div>
            </div>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  }
}

export const serviceColor = new ServiceColor()
