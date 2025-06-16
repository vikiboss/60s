# ⏰ 60s API v2

![Update Status](https://github.com/vikiboss/60s-static-host/workflows/schedule/badge.svg) ![GitHub](https://img.shields.io/github/v/release/vikiboss/60s?label=GitHub) ![Docker](https://img.shields.io/docker/v/vikiboss/60s?style=flat&label=Docker) ![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white) ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white) ![Deno](https://img.shields.io/badge/Deno-000000?logo=deno&logoColor=white) [![群](https://img.shields.io/badge/%E4%BC%81%E9%B9%85%E7%BE%A4-595941841-ff69b4)](https://qm.qq.com/q/RpJXzgfAMG)

一系列 **高质量、开源、可靠、全球 CDN 加速的** 开放 API 集合，使用 [Deno](https://deno.com/) 构建，托管在 [Deno Deploy](https://deno.com/deploy) 上，也支持 [Docker](https://docker.com)、[Cloudflare Workers](https://www.cloudflare.com/zh-cn/developer-platform/products/workers/)、[Bun](https://bun.sh/) 和 [Node.js](https://nodejs.org/) 部署。

> [!WARNING]
> v1 版本已于 2025/1/15 停止更新，在 [v1-legacy](https://github.com/vikiboss/60s/tree/v1-legacy) 分支上，请尽快迁移至 v2，v1 版本将于 2025/6/31 完全停止服务，届时域名会切换到 v2 版本。

## 🤔️ 缘起

参考 [这篇文章](https://xlog.viki.moe/60s) 了解更多。

## ⚖️ API 实现原则和使用建议

- 只采用官方、权威的数据源头，保证准确性和可用性
- 对日更数据采取缓存加速策略，对用户无感、毫秒级响应
- 为了追求更快的响应，可以查看源码，直接访问对应 API 的原 API 数据（但原始数据量大、字段繁多，不易处理）

> 待续

## 🍱 API 包含哪些？

目前包含的接口如下，仍在持续增加中，全面的 API 文档已公开托管在 [Apifox](https://docs.60s-api.viki.moe) 上。

主域名: https://60s-api.viki.moe （Deno Deploy，部分地区可能被墙）

> [!TIP]
> 
> 如果你只关注 60s 新闻，其 API 格式如下：
>
> 默认 JSON 格式：https://60s-api.viki.moe/v2/60s
> 
> 文字版本：https://60s-api.viki.moe/v2/60s?encoding=text
> 
> 图片版本：https://60s-api.viki.moe/v2/60s?encoding=image （重定向到微信公众号链接，存在防盗链）
> 
> 代理图片版本：https://60s-api.viki.moe/v2/60s?encoding=image-proxy （代理链接，绕过防盗链限制，备用）
> 
> 更多详情请看文档: https://docs.60s-api.viki.moe, 如果对你有帮助，请不要吝啬你的 Star～

- ⏰ 日更资讯
  - 🌍 每天 60 秒读懂世界 (数据源来自 [vikiboss/60s-static-host](https://github.com/vikiboss/60s-static-host) 仓库，源头是微信公众号，正常情况下每天凌晨更新)
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
  - 🌈 哈希/解压/压缩（包含 `md5`、`base64`、`URL`、`GZIP` 等）
- 😄 消遣娱乐
  - 💬 随机 KFC 段子（数据来源 [vikiboss/v50](https://github.com/vikiboss/v50)）
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

### Deno

```bash
deno install && deno run -A deno.ts
```

### Bun

```bash
bun install && bun run bun.ts
```

### Node.js

> 要求 Node.js 版本 >= 22.6 以支持 `--experimental-strip-types` 参数来执行 TypeScript 文件

```bash
npm install && node --experimental-strip-types node.ts
```

### Cloudflare Workers

```bash
npm install && npx wrangler publish
```

## 60s 的数据更新策略

![arch](./images/arch.png)

## 🧑‍🤝‍🧑 用户群

使用过程中有任何问题或建议，欢迎加入企鹅群反馈: [![群](https://img.shields.io/badge/%E4%BC%81%E9%B9%85%E7%BE%A4-595941841-ff69b4)](https://qm.qq.com/q/RpJXzgfAMG)。

## 💰 赞赏

如果觉得这个项目对你有帮助，欢迎请我喝咖啡 ☕️ ～

> 采取**自愿**原则, 收到的赞赏将用于提高开发者积极性和开发环境。

<div id='readme-reward' style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%">
  <img src="https://s2.loli.net/2022/11/16/X2kFMdaxvSc1V5P.jpg" alt="wxpay" height="160px"style="margin: 24px;"/>
  <img src="https://s2.loli.net/2022/11/16/vZ4xkCopKRmIFVX.jpg" alt="alipay" height="160px" style="margin:24px;"/>
</div>

感谢以下小伙伴的赞赏（排名不分先后）：

<!-- 表格 -->
|           赞赏人           | 金额  |  途径  |        备注        |
| :------------------------: | :---: | :----: | :----------------: |
|           Update           | 6.66  | WeChat | 感谢大佬的开源分享 |
|            匿名            | 0.01  | WeChat |         -          |
|         月夜忆江南         | 5.00  | WeChat |         -          |
|            匿名            | 1.66  | WeChat |         -          |
|        GoooodJooB7         | 1.66  | WeChat |    谢谢大佬开源    |
|            匿名            | 1.66  | WeChat |         -          |
| 十七岁就学会吃饭的天才少年 | 5.00  | WeChat |         -          |
|          Sundrops          | 1.66  | WeChat |   感谢友友的接口   |
|        春风伴我余生        | 10.00 | WeChat |         -          |
|             杰             | 1.00  | WeChat |         -          |
|            ---             |  ---  |  ---   |        ---         |
|            *斌             | 12.90 | Alipay |         -          |
|            *杰             | 20.00 | Alipay |         -          |
|            **杰            | 9.90  | Alipay |         -          |
|            ---             |  ---  |  ---   |        ---         |
|            Ko.             | 11.66 |   QQ   |         -          |
|          yijiong           | 15.00 |   QQ   |  a cup of coffee   |


## 🪪 License （开源协议）

[MIT](license) License © 2022-PRESENT Viki
