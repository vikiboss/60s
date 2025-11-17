import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

class ServiceQQ {
  handle(): RouterMiddleware<'/qq/profile'> {
    return async (ctx) => {
      const qq = await Common.getParam('qq', ctx.request)
      const size = +((await Common.getParam('size', ctx.request)) || 0)

      if (!qq) {
        return Common.requireArguments('qq', ctx.response)
      }

      if (!/^\d{5,11}$/.test(qq)) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '无效的 QQ 号码')
        return
      }

      const validSizes = [0, 40, 100, 160, 640]

      if (!validSizes.includes(size)) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, `无效的 size 参数。必须是以下之一: ${validSizes.join(', ')}`)
        return
      }

      const data = await this.#fetch(qq, size)

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = data.nickname
          break

        case 'markdown':
          ctx.response.body = `# 👤 QQ 用户信息\n\n![${data.nickname}](${data.avatar_url})\n\n**昵称**: ${data.nickname}\n\n**QQ 号**: ${data.qq}\n\n**头像尺寸**: ${data.avatar_size}px`
          break

        case 'image':
          ctx.response.redirect(data.avatar_url)
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(qq: string, size: number): Promise<QQUserInfo> {
    const options = { headers: { 'User-Agent': Common.chromeUA } }

    try {
      const api = `https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=${qq}`
      const response = await fetch(api, options)
      const text = await response.text()

      const jsonMatch = text.match(/portraitCallBack\((.*?)\)/)

      if (!jsonMatch) {
        throw new Error(`解析 QQ 用户信息失败，可能被腾讯 WAF 拦截，返回内容：${text}`)
      }

      const data = JSON.parse(jsonMatch[1])
      const userKey = qq.toString()
      const userInfo = data[userKey]
      const nickname = userInfo?.[6] || ''

      const avatar = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`

      return {
        qq,
        nickname,
        avatar_url: avatar,
        avatar_size: size,
      }
    } catch (error) {
      throw new Error(`获取 QQ 用户信息失败: ${error}`)
    }
  }
}

export const serviceQQ = new ServiceQQ()

interface QQUserInfo {
  qq: string
  nickname: string
  avatar_url: string
  avatar_size: number
}
