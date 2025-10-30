# ⏰ 60s API

![Update Status](https://github.com/vikiboss/60s-static-host/workflows/schedule/badge.svg) ![GitHub](https://img.shields.io/github/v/release/two2025/60s?label=GitHub) ![Docker](https://img.shields.io/docker/v/two2025/60s?style=flat&label=Docker) ![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white) ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white) ![Deno](https://img.shields.io/badge/Deno-000000?logo=deno&logoColor=white) [![群](https://img.shields.io/badge/%E4%BC%81%E9%B9%85%E7%BE%A4-595941841-ff69b4)](https://qm.qq.com/q/RpJXzgfAMG)


## ⚖️ API 实现原则和使用建议

- 尽可能采用官方、权威的数据源头，保证准确性和可用性
- 对日更数据采取缓存加速策略，对用户无感、毫秒级响应
- 为了追求更快的响应，可查看源码直接使用对应 API 的原数据（但原始数据量大、字段繁多，不易处理）

> 待续。

## 🌍 60s 看世界接口




目前包含的接口如下，仍在持续增加中，全面的 API 文档已公开托管在 [Apifox](https://doc.cccccc.plus) 上。

主域名: https://60s.cccccc.plus 



更多详情请看文档: https://doc.cccccc.plus


- 默认 JSON 格式：https://60s.cccccc.plus/v2/60s
- 文字版本：https://60s.cccccc.plus/v2/60s?encoding=text
- 图片版本：https://60s.cccccc.plus/v2/60s?encoding=image （重定向到微信公众号链接，存在防盗链）
- 代理图片版本：https://60s.cccccc.plus/v2/60s?encoding=image-proxy （代理链接，绕过防盗链限制，备用）


> 更多详情请看文档: https://doc.cccccc.plus, 如果对你有帮助，请不要吝啬你的 Star～

- ⏰ 日更资讯
  - 🌍 每天 60 秒读懂世界 (数据源来自 [two2025/60s-static-host](https://github.com/two2025/60s-static-host) 仓库，源头是微信公众号，正常情况下每天凌晨更新)
  - 🏞️ 必应每日壁纸（Bing）

  - 💰 当日货币汇率
  - 📅 历史上的今天
- 🎉 热门榜单
  - 📺 哔哩哔哩热搜榜
  - 👀 猫眼票房排行榜（**哪吒 2 实时票房**）
  - 🦊 微博热搜榜
  - ❓ 知乎热门话题
  - 🎵 抖音热搜榜
  - 📰 头条热搜榜
- 🚀 实用功能
  - 🎮 Epic Games 免费游戏
  - ❓ 百度百科词条
  - 🌍 在线翻译（支持 109 种语言）
  - 📡 公网 IP 地址
  - 🐦 链接 [OG](https://ogp.me/) 信息
  - 🌈 哈希/解压/压缩（包含 `md5`/`base64`/`URL`/`GZIP` 等）
  - 🌦️ 实时天气查询（支持全国城市/地区查询，数据来源 [中国天气网](https://weather.com.cn/)）
  - 🗓️ 农历日期转换（公历农历互转、天干地支、生肖、节气、节假日等，使用 [tyme4ts](https://github.com/6tail/tyme4ts) 库处理）
  - 🤖️ 每日 AI 快讯（来自 [AI 工具集](https://ai-bot.cn/daily-ai-news/)）
- 😄 消遣娱乐
  - 💬 随机 KFC 段子
  - 💬 随机一言
  - ✨ 随机运势
  - ⚛️ 随机化合物
  - 🎤 随机唱歌音频
  - 🤣 随机搞笑段子
  - 🤭 随机发病文学
  - 📖 随机答案之书
- ... 更多功能持续增加中

## 💻 本地部署

### Docker

```bash
docker run -d \
  --restart always \
  --name 60s \
  -p 4399:4399 \
  vikiboss/60s:latest
```

**其他 JS/TS 运行时（备选）**

```bash
# Deno
deno install && deno run -A deno.ts

# Bun
bun install && bun run bun.ts

# Node.js (需要 v22.6+)
npm install && node --experimental-strip-types node.ts
```

### ☁️ 云端部署

**Cloudflare Workers**

方式一，使用 Workers 的可视化界面：

1. [Fork 本仓库](https://github.com/vikiboss/60s/fork)
2. 在 [Cloudflare Workers](https://workers.cloudflare.com/) 通过 GitHub 创建项目
3. 使用默认配置直接部署

> 仓库已预置 Workers 配置，无需额外设置。后续更新只需同步主仓库即可。

方式二，命令行操作，clone 本仓库然后执行：

```bash
npm install && npx wrangler publish
```

---

## 📋 数据更新机制

![数据流架构图](./images/arch.png)

### 🔄 更新策略
- **数据抓取**: GitHub Actions 定时任务
- **存储方式**: 静态 JSON 文件 + CDN 缓存  
- **更新频率**: 每日自动更新

> 可视化架构图: [60s 更新策略 - Excalidraw](https://excalidraw.com/#json=VRffPBlMuFBkOlTbGe7IH,0C6yClfLME65ZhmQ30ywdg)


1. [fork](https://github.com/vikiboss/60s/fork) 本仓库
2. 打开 [workers.cloudflare.com](https://workers.cloudflare.com/)
3. 按照引导，通过 fork 的仓库创建 Workers 项目，使用默认配置直接部署即可
4. （可选）绑定自己的域名，或者使用 Cloudflare 提供的免费域名

> 本仓库内已经放置了预先配好的 Workers 配置，你无需关心配置细节，后续如需更新，只需要同步主仓库的代码即可。


## 🤝 社区与支持

### 🙏 致谢

本项目的部分代码、灵感、实现方式等参考了以下优秀开源项目，排名不分先后：

- [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub)
- [Rankslive/RanksLiveApi](https://github.com/Rankslive/RanksLiveApi)

### 💬 交流

- **QQ 群**: [![加入群聊](https://img.shields.io/badge/%E4%BC%81%E9%B5%9D%E7%BE%A4-595941841-ff69b4)](https://qm.qq.com/q/RpJXzgfAMG) (问题反馈、使用交流)
- **GitHub**: [Issues](https://github.com/vikiboss/60s/issues) (Bug 报告、功能建议)
- **文档**: [API 文档](https://docs.60s-api.viki.moe) (详细使用说明)

### 🎯 项目起源

本项目最早源于 [这篇文章](https://xlog.viki.moe/60s) 中提到的想法。

### 📈 项目 Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=vikiboss/60s&type=Date)](https://star-history.com/#vikiboss/60s&Date)

## 💰 赞赏项目


如果觉得这个项目对你有帮助，欢迎请 **原作者** 喝咖啡 ☕️ ～


> 采取**自愿**原则, 收到的赞赏将用于提高开发者积极性和开发环境。

<div id='readme-reward' style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%">
  <img src="https://s2.loli.net/2022/11/16/X2kFMdaxvSc1V5P.jpg" alt="wxpay" height="160px"style="margin: 24px;"/>
  <img src="https://s2.loli.net/2022/11/16/vZ4xkCopKRmIFVX.jpg" alt="alipay" height="160px" style="margin:24px;"/>
</div>



<details>
<summary>感谢以下小伙伴的赞赏（点击展开/收起，排名不分先后）</summary>


<!-- 表格 -->
|           赞赏人            |  金额  |  途径  |                  备注                  |
| :-------------------------: | :----: | :----: | :------------------------------------: |
|           Update            |  6.66  | WeChat |           感谢大佬的开源分享           |
|            匿名             |  0.01  | WeChat |                   -                    |
|         月夜忆江南          |  5.00  | WeChat |                   -                    |
|            匿名             |  1.66  | WeChat |                   -                    |
|         GoooodJooB7         |  1.66  | WeChat |              谢谢大佬开源              |
|            匿名             |  1.66  | WeChat |                   -                    |
| 十七岁就学会吃饭的天才少年  |  5.00  | WeChat |                   -                    |
|          Sundrops           |  1.66  | WeChat |             感谢友友的接口             |
|        春风伴我余生         | 10.00  | WeChat |                   -                    |
|             杰              |  1.00  | WeChat |                   -                    |
|            Blue             |  6.66  | WeChat |           Blue 祝开发者 6666           |
|           聆听、            | 10.00  | WeChat |           喝杯咖啡，记得加冰           |
|            匿名             | 100.00 | WeChat |                 好项目                 |
| 卤蛋 （HelloGitHub 发起人） | 88.88  | WeChat |      很喜欢你的项目，加油 ^ O ^ ~      |
|             Lee             |  6.66  | WeChat |                感谢分享                |
|          世界和平           | 66.00  | WeChat |           世界需要更多的英雄           |
|         севастополь         |  6.66  | WeChat |                买包辣条                |
|             爪              |  2.00  | WeChat |                   -                    |
|             LMQ             | 18.80  | WeChat | 大佬的响应速度，我泪目了，请大佬喝咖啡 |
|             ---             |  ---   |  ---   |                  ---                   |
|             *斌             | 12.90  | Alipay |                   -                    |
|             *杰             | 20.00  | Alipay |                   -                    |
|            **杰             |  9.90  | Alipay |                   -                    |
|             ---             |  ---   |  ---   |                  ---                   |
|             Ko.             | 11.66  |   QQ   |                   -                    |
|           yijiong           | 15.00  |   QQ   |            a cup of coffee             |

> 如有遗漏，欢迎通过 issue 或者 QQ 群 595941841 反馈。

</details>

## 🪪 License （开源协议）

[MIT](license) License © 2022-PRESENT 
