import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

interface HealthParams {
  height: number
  weight: number
  gender: 'male' | 'female'
  age: number
}

interface HealthResult {
  basic_info: {
    height: string
    height_desc: string
    weight: string
    weight_desc: string
    gender: string
    gender_desc: string
    age: string
    age_desc: string
  }
  bmi: {
    value: number
    value_desc: string
    category: string
    category_desc: string
    evaluation: string
    evaluation_desc: string
    risk: string
    risk_desc: string
  }
  weight_assessment: {
    ideal_weight_range: string
    ideal_weight_range_desc: string
    standard_weight: string
    standard_weight_desc: string
    status: string
    status_desc: string
    adjustment: string
    adjustment_desc: string
  }
  metabolism: {
    bmr: string
    bmr_desc: string
    tdee: string
    tdee_desc: string
    recommended_calories: string
    recommended_calories_desc: string
    weight_loss_calories: string
    weight_loss_calories_desc: string
    weight_gain_calories: string
    weight_gain_calories_desc: string
  }
  body_surface_area: {
    value: string
    value_desc: string
    formula: string
    formula_desc: string
  }
  body_fat: {
    percentage: string
    percentage_desc: string
    category: string
    category_desc: string
    fat_weight: string
    fat_weight_desc: string
    lean_weight: string
    lean_weight_desc: string
  }
  health_advice: {
    daily_water_intake: string
    daily_water_intake_desc: string
    exercise_recommendation: string
    exercise_recommendation_desc: string
    nutrition_advice: string
    nutrition_advice_desc: string
    health_tips: string[]
    health_tips_desc: string
  }
  ideal_measurements: {
    chest: string
    chest_desc: string
    waist: string
    waist_desc: string
    hip: string
    hip_desc: string
    note: string
    note_desc: string
  }
  disclaimer: string
}

class ServiceHealth {
  handle(): RouterMiddleware<'/health'> {
    return async (ctx) => {
      const height = await Common.getParam('height', ctx.request)
      const weight = await Common.getParam('weight', ctx.request)
      const gender = await Common.getParam('gender', ctx.request)
      const age = await Common.getParam('age', ctx.request)

      if (!height || !weight || !gender || !age) {
        Common.requireArguments(['height', 'weight', 'gender', 'age'], ctx.response)
        return
      }

      const heightNum = Number.parseFloat(height)
      const weightNum = Number.parseFloat(weight)
      const ageNum = Number.parseInt(age)

      if (Number.isNaN(heightNum) || Number.isNaN(weightNum) || Number.isNaN(ageNum)) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '参数格式错误：height 和 weight 必须是数字，age 必须是整数')
        return
      }

      if (gender !== 'male' && gender !== 'female') {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '参数 gender 必须是 "male" 或 "female"')
        return
      }

      if (heightNum < 50 || heightNum > 300 || weightNum < 10 || weightNum > 300 || ageNum < 1 || ageNum > 150) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(
          null,
          400,
          '参数超出合理范围：身高 (50-300cm)，体重 (10-300kg)，年龄 (1-150岁)',
        )
        return
      }

      const params: HealthParams = {
        height: heightNum,
        weight: weightNum,
        gender,
        age: ageNum,
      }

      const result = this.calculateHealth(params)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = this.formatAsText(result)
          break

        case 'markdown':
          ctx.response.body = this.formatAsMarkdown(result)
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }

  private calculateHealth(params: HealthParams): HealthResult {
    const { height, weight, gender, age } = params
    const heightInM = height / 100

    // BMI 计算
    const bmi = weight / (heightInM * heightInM)
    const bmiCategory = this.getBMICategory(bmi)

    // 理想体重计算
    const idealWeight = this.getIdealWeight(height)
    const standardWeight = this.getStandardWeight(height)

    // 基础代谢率计算 (Harris-Benedict公式)
    const bmr = this.calculateBMR(weight, height, age, gender)

    // 每日总消耗 (TDEE)
    const tdee = bmr * 1.6 // 轻度活动系数

    // 体表面积 (Du Bois公式)
    const bsa = this.calculateBSA(weight, height)

    // 体脂率推估
    const bodyFat = this.estimateBodyFat(bmi, age, gender, weight)

    // 理想三围
    const measurements = this.getIdealMeasurements(height, gender)

    return {
      basic_info: {
        height: `${height}cm`,
        height_desc: '身高',
        weight: `${weight}kg`,
        weight_desc: '体重',
        gender: gender === 'male' ? '男性' : '女性',
        gender_desc: '性别',
        age: `${age}岁`,
        age_desc: '年龄',
      },
      bmi: {
        value: Math.round(bmi * 100) / 100,
        value_desc: 'BMI 值',
        category: bmiCategory.category,
        category_desc: 'BMI 分类',
        evaluation: bmiCategory.evaluation,
        evaluation_desc: 'BMI 评价',
        risk: bmiCategory.risk,
        risk_desc: '健康风险',
      },
      weight_assessment: {
        ideal_weight_range: `${idealWeight.min}-${idealWeight.max}kg`,
        ideal_weight_range_desc: '理想体重范围',
        standard_weight: `${standardWeight}kg`,
        standard_weight_desc: '标准体重',
        status: this.getWeightStatus(weight, idealWeight),
        status_desc: '体重状态',
        adjustment: this.getWeightAdjustment(weight, idealWeight),
        adjustment_desc: '调整建议',
      },
      metabolism: {
        bmr: `${Math.round(bmr)} 卡路里/天`,
        bmr_desc: '基础代谢率',
        tdee: `${Math.round(tdee)} 卡路里/天`,
        tdee_desc: '每日总消耗',
        recommended_calories: `${Math.round(tdee)} 卡路里/天`,
        recommended_calories_desc: '推荐卡路里摄入',
        weight_loss_calories: `${Math.round(tdee - 500)} 卡路里/天`,
        weight_loss_calories_desc: '减重卡路里',
        weight_gain_calories: `${Math.round(tdee + 300)} 卡路里/天`,
        weight_gain_calories_desc: '增重卡路里',
      },
      body_surface_area: {
        value: `${bsa}m²`,
        value_desc: '体表面积',
        formula: 'Du Bois 公式',
        formula_desc: '计算公式',
      },
      body_fat: {
        percentage: `${bodyFat.percentage}%`,
        percentage_desc: '体脂率',
        category: bodyFat.category,
        category_desc: '体脂分类',
        fat_weight: `${bodyFat.fatWeight}kg`,
        fat_weight_desc: '脂肪重量',
        lean_weight: `${bodyFat.leanWeight}kg`,
        lean_weight_desc: '瘦体重',
      },
      health_advice: {
        daily_water_intake: this.getWaterIntake(weight, age, gender),
        daily_water_intake_desc: '每日饮水量',
        exercise_recommendation: this.getExerciseAdvice(bmi, age, gender),
        exercise_recommendation_desc: '运动建议',
        nutrition_advice: this.getNutritionAdvice(bmiCategory.category, gender, age),
        nutrition_advice_desc: '营养建议',
        health_tips: this.getHealthTips(bmi, age, gender),
        health_tips_desc: '健康提示',
      },
      ideal_measurements: {
        chest: measurements.chest,
        chest_desc: '胸围',
        waist: measurements.waist,
        waist_desc: '腰围',
        hip: measurements.hip,
        hip_desc: '臀围',
        note: measurements.note,
        note_desc: '说明',
      },
      // 免责申明
      disclaimer: '结果基于通用公式和统计数据，仅供参考，不能替代专业医疗建议。如有健康问题，请咨询医生。',
    }
  }

  private getBMICategory(bmi: number) {
    if (bmi < 18.5) {
      return {
        category: '体重过轻',
        evaluation: '体重不足，需要适当增重',
        risk: '营养不良风险',
      }
    } else if (bmi < 24) {
      return {
        category: '正常体重',
        evaluation: '体重正常，保持良好',
        risk: '健康风险较低',
      }
    } else if (bmi < 28) {
      return {
        category: '超重',
        evaluation: '体重超重，建议减重',
        risk: '慢性病风险增加',
      }
    } else {
      return {
        category: '肥胖',
        evaluation: '肥胖状态，需要积极减重',
        risk: '高血压、糖尿病等疾病风险显著增加',
      }
    }
  }

  private getIdealWeight(height: number) {
    // WHO推荐的理想BMI范围 18.5-24
    const heightInM = height / 100
    const min = Math.round(18.5 * heightInM * heightInM * 10) / 10
    const max = Math.round(24 * heightInM * heightInM * 10) / 10

    return { min, max }
  }

  private getStandardWeight(height: number) {
    // 标准体重公式：身高(cm) - 105
    return Math.round((height - 105) * 10) / 10
  }

  private calculateBMR(weight: number, height: number, age: number, gender: string) {
    // Harris-Benedict公式
    if (gender === 'male') {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
    } else {
      return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
    }
  }

  private calculateBSA(weight: number, height: number) {
    // Du Bois公式
    const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725)
    return Math.round(bsa * 100) / 100
  }

  private estimateBodyFat(bmi: number, age: number, gender: string, weight: number) {
    // 简化的体脂率估算公式
    let bodyFatPercentage: number

    if (gender === 'male') {
      bodyFatPercentage = 1.2 * bmi + 0.23 * age - 16.2
    } else {
      bodyFatPercentage = 1.2 * bmi + 0.23 * age - 5.4
    }

    bodyFatPercentage = Math.max(3, Math.min(50, bodyFatPercentage))
    const percentage = Math.round(bodyFatPercentage * 10) / 10

    const fatWeight = Math.round((percentage / 100) * weight * 10) / 10
    const leanWeight = Math.round((weight - fatWeight) * 10) / 10

    let category: string
    if (gender === 'male') {
      if (percentage < 10) category = '极低'
      else if (percentage < 15) category = '正常'
      else if (percentage < 20) category = '略高'
      else category = '过高'
    } else {
      if (percentage < 16) category = '极低'
      else if (percentage < 24) category = '正常'
      else if (percentage < 30) category = '略高'
      else category = '过高'
    }

    return {
      percentage: percentage.toString(),
      category,
      fatWeight: fatWeight.toString(),
      leanWeight: leanWeight.toString(),
    }
  }

  private getWeightStatus(weight: number, idealWeight: { min: number; max: number }) {
    if (weight < idealWeight.min) {
      return '体重偏轻'
    } else if (weight > idealWeight.max) {
      return '体重偏重'
    } else {
      return '体重正常'
    }
  }

  private getWeightAdjustment(weight: number, idealWeight: { min: number; max: number }) {
    if (weight < idealWeight.min) {
      const diff = idealWeight.min - weight
      return `建议增重 ${diff.toFixed(1)}kg`
    } else if (weight > idealWeight.max) {
      const diff = weight - idealWeight.max
      return `建议减重 ${diff.toFixed(1)}kg`
    } else {
      return '保持当前体重'
    }
  }

  private getWaterIntake(weight: number, age: number, gender: string) {
    // 基础需水量：每公斤体重30-35ml水
    let baseIntake = weight * 32

    // 年龄调整：随年龄增长适当减少
    if (age >= 65) {
      baseIntake *= 0.9 // 老年人代谢慢，适当减少
    } else if (age >= 50) {
      baseIntake *= 0.95
    } else if (age <= 25) {
      baseIntake *= 1.05 // 年轻人代谢快，适当增加
    }

    // 性别调整：男性肌肉量多，需水量稍大
    if (gender === 'male') {
      baseIntake *= 1.05
    }

    const intake = Math.round(baseIntake / 250) * 250 // 四舍五入到250ml
    const cups = Math.round(intake / 250)

    let tips = `${intake}ml (约 ${cups} 杯水)`

    // 添加具体建议
    if (age >= 65) {
      tips += `，老年人应少量多次，避免一次性大量饮水`
    } else if (age <= 30) {
      tips += `，运动时需额外补充 500-1000ml`
    }

    return tips
  }

  private getExerciseAdvice(bmi: number, age: number, gender: string) {
    let baseAdvice = ''
    let ageAdvice = ''

    // BMI基础建议
    if (bmi < 18.5) {
      baseAdvice = '适度的力量训练有助于增强体质'
    } else if (bmi < 24) {
      baseAdvice = '继续保持运动习惯，有氧运动和力量训练相结合效果更佳'
    } else if (bmi < 28) {
      baseAdvice = '适当增加运动量，有氧运动有助于体重管理'
    } else {
      baseAdvice = '可以从轻度运动开始，如散步、游泳等低冲击运动'
    }

    // 年龄相关建议
    if (age <= 30) {
      ageAdvice = '年轻人可选择多样化的运动方式，建议每周运动 3-5 次'
    } else if (age <= 50) {
      ageAdvice = '成年人推荐每周 150 分钟中等强度运动，如快走、游泳、骑车等'
    } else if (age <= 65) {
      ageAdvice = '中年人适合低冲击运动，注意运动前的热身和运动后的放松'
    } else {
      ageAdvice = '老年人以维持日常活动能力为主，可选择太极、散步等温和运动'
    }

    // 性别差异化建议
    let genderTip = ''
    if (gender === 'male' && age >= 40) {
      genderTip = '，注意心血管健康'
    } else if (gender === 'female' && age >= 45) {
      genderTip = '，适度的负重运动有益骨骼健康'
    }

    return `${baseAdvice}。${ageAdvice}${genderTip}`
  }

  private getNutritionAdvice(bmiCategory: string, gender: string, age: number) {
    let baseAdvice = ''
    const specialTips: string[] = []

    // BMI基础营养建议
    switch (bmiCategory) {
      case '体重过轻':
        baseAdvice = '建议增加优质蛋白质摄入，如鱼、蛋、奶制品，可适当增加餐次'
        break
      case '正常体重':
        baseAdvice = '保持均衡饮食，三大营养素合理搭配，定时定量进餐'
        break
      case '超重':
        baseAdvice = '适当控制总热量，多吃蔬菜水果，减少高糖高脂食物'
        break
      case '肥胖':
        baseAdvice = '控制热量摄入，选择营养密度高的食物，可考虑咨询营养专家'
        break
      default:
        baseAdvice = '均衡营养，规律饮食'
    }

    // 年龄相关营养需求
    if (age <= 30) {
      specialTips.push('年轻人新陈代谢较快，可适当增加能量摄入')
    } else if (age <= 50) {
      specialTips.push('成年人注重抗氧化营养素，多吃深色蔬菜和水果')
    } else {
      specialTips.push('中老年人适当补充钙质和维生素 D，选择易消化的食物')
    }

    // 性别相关营养需求
    if (gender === 'male') {
      specialTips.push('男性可适当增加蛋白质摄入')
    } else {
      if (age >= 20 && age <= 50) {
        specialTips.push('女性注意铁质和叶酸的补充')
      }
      if (age >= 45) {
        specialTips.push('更年期女性可适量增加豆制品摄入')
      }
    }

    const tips = specialTips.length > 0 ? `。${specialTips.join('，')}` : ''
    return `${baseAdvice}${tips}`
  }

  private getHealthTips(bmi: number, age: number, gender: string): string[] {
    const tips: string[] = []

    // 基础健康提示
    tips.push('保持充足睡眠，成年人建议每天 7-9 小时')
    tips.push('定期体检有助于早期发现健康问题')
    tips.push('保持良好心态，适当释放压力')

    // BMI相关提示
    if (bmi < 18.5) {
      tips.push('体重偏轻时注意营养均衡，避免过度疲劳')
    } else if (bmi >= 24) {
      tips.push('控制饮食量，养成细嚼慢咽的习惯')
      tips.push('减少久坐时间，适当增加日常活动')
    }

    // 年龄相关提示
    if (age <= 30) {
      tips.push('年轻人要注意作息规律，合理安排工作与休息')
      tips.push('长时间用眼后适当休息，保护视力')
    } else if (age <= 50) {
      tips.push('中年人关注心血管健康，适当运动')
      tips.push('注意钙质补充，预防骨质疏松')
    } else {
      tips.push('老年人注意居家安全，预防跌倒')
      tips.push('保持社交活动，维护心理健康')
    }

    // 性别相关提示
    if (gender === 'female') {
      if (age >= 45) {
        tips.push('更年期女性可关注骨骼健康')
      } else if (age >= 20 && age <= 40) {
        tips.push('育龄期女性注意营养摄入的均衡性')
      }
    } else {
      if (age >= 40) {
        tips.push('中年男性适当关注前列腺健康')
        tips.push('戒烟限酒有益心血管健康')
      }
    }

    // 通用生活提示
    tips.push('培养兴趣爱好，保持积极的生活态度')
    tips.push('多饮水，成年人每天 1500-2000ml 为宜')

    return tips
  }

  private getIdealMeasurements(height: number, gender: string) {
    // 基于身高的理想三围计算
    if (gender === 'male') {
      const chest = Math.round(height * 0.48)
      const waist = Math.round(height * 0.42)
      const hip = Math.round(height * 0.47)

      return {
        chest: `${chest}cm`,
        waist: `${waist}cm`,
        hip: `${hip}cm`,
        note: '男性理想三围参考标准',
      }
    } else {
      const chest = Math.round(height * 0.51)
      const waist = Math.round(height * 0.37)
      const hip = Math.round(height * 0.53)

      return {
        chest: `${chest}cm`,
        waist: `${waist}cm`,
        hip: `${hip}cm`,
        note: '女性理想三围参考标准',
      }
    }
  }

  private formatAsText(result: HealthResult): string {
    return `
🏥 ✨ 健康评估报告 ✨ 🏥

👤 身高 ${result.basic_info.height} 体重 ${result.basic_info.weight} ${result.basic_info.gender} ${result.basic_info.age}

📊 BMI: ${result.bmi.value} (正常 18.5-24) - ${result.bmi.category}
⚖️ 体重状态: ${result.weight_assessment.status}
🎯 理想体重: ${result.weight_assessment.ideal_weight_range}

🔥 基础代谢: BMR ${result.metabolism.bmr} | TDEE ${result.metabolism.tdee}
🍽️ 卡路里: 维持 ${result.metabolism.recommended_calories} 减重 ${result.metabolism.weight_loss_calories} 增重 ${result.metabolism.weight_gain_calories}

🏃 体脂率: ${result.body_fat.percentage} (${result.body_fat.category}) 
📏 脂肪 ${result.body_fat.fat_weight} 瘦体重 ${result.body_fat.lean_weight} 体表面积 ${result.body_surface_area.value}

👗 参考三围: 胸 ${result.ideal_measurements.chest} 腰 ${result.ideal_measurements.waist} 臀 ${result.ideal_measurements.hip}

🎯 【个性化建议】
💧 ${result.health_advice.daily_water_intake}
🏃‍♀️ ${result.health_advice.exercise_recommendation}
🥗 ${result.health_advice.nutrition_advice}
📝 ${result.weight_assessment.adjustment}

💡 健康提示:
${result.health_advice.health_tips
  .slice(0, 3)
  .map((tip) => `• ${tip}`)
  .join('\n')}

⚠️ ${result.disclaimer}
    `.trim()
  }

  private formatAsMarkdown(result: HealthResult): string {
    return `# 🏥 健康评估报告

## 👤 基本信息

| 项目 | 数值 |
|------|------|
| **身高** | ${result.basic_info.height} |
| **体重** | ${result.basic_info.weight} |
| **性别** | ${result.basic_info.gender} |
| **年龄** | ${result.basic_info.age} |

## 📊 体质指数 (BMI)

**BMI**: ${result.bmi.value} | **${result.bmi.category}**

*${result.bmi.evaluation}*

- 健康风险: ${result.bmi.risk}

## ⚖️ 体重评估

- **当前状态**: ${result.weight_assessment.status}
- **理想体重范围**: ${result.weight_assessment.ideal_weight_range}
- **标准体重**: ${result.weight_assessment.standard_weight}
- **调整建议**: ${result.weight_assessment.adjustment}

## 🔥 代谢与热量

| 指标 | 数值 |
|------|------|
| **基础代谢率 (BMR)** | ${result.metabolism.bmr} |
| **每日总消耗 (TDEE)** | ${result.metabolism.tdee} |
| **维持体重卡路里** | ${result.metabolism.recommended_calories} |
| **减重卡路里** | ${result.metabolism.weight_loss_calories} |
| **增重卡路里** | ${result.metabolism.weight_gain_calories} |

## 🏃 体脂与身体组成

- **体脂率**: ${result.body_fat.percentage} (${result.body_fat.category})
- **脂肪重量**: ${result.body_fat.fat_weight}
- **瘦体重**: ${result.body_fat.lean_weight}
- **体表面积**: ${result.body_surface_area.value}

## 👗 理想三围参考

| 部位 | 尺寸 |
|------|------|
| **胸围** | ${result.ideal_measurements.chest} |
| **腰围** | ${result.ideal_measurements.waist} |
| **臀围** | ${result.ideal_measurements.hip} |

*${result.ideal_measurements.note}*

## 💧 个性化健康建议

### 每日饮水

${result.health_advice.daily_water_intake}

### 🏃‍♀️ 运动建议

${result.health_advice.exercise_recommendation}

### 🥗 营养建议

${result.health_advice.nutrition_advice}

### 💡 健康提示

${result.health_advice.health_tips.map((tip) => `- ${tip}`).join('\n')}

---

⚠️ **免责声明**: ${result.disclaimer}`
  }
}

export const serviceHealth = new ServiceHealth()
