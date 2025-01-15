# 【重要】 v1 版本即将在 2025/6/30 号后下线，请及时迁移到 [v2](https://github.com/vikiboss/60s)。

# ⏰ 60s API v1 (即将停止维护)

使用 [Deno](https://deno.com/) 构建的简单 API 列表项目，不仅仅是每天 60 秒读懂世界～

请参考 [这篇文章](https://xlog.viki.moe/60s) 了解更多，可以参考 [这里](https://github.com/vikiboss/60s/issues/2#issuecomment-1765769220) 自行部署。

> 60s 接口数据目前来源于 [这个](https://www.zhihu.com/column/c_1715391799055720448) 知乎专栏，原专栏在 [这里](https://www.zhihu.com/column/c_1261258401923026944) （已停更）。
>
> 其他接口的数据均来源于对应官方、权威平台的数据接口，确保数据的实时与稳定。

## 🧑‍🤝‍🧑 用户群

使用过程中有任何问题或建议，欢迎加入企鹅群反馈: [![群](https://img.shields.io/badge/%E4%BC%81%E9%B9%85%E7%BE%A4-595941841-ff69b4)](https://qm.qq.com/q/RpJXzgfAMG)。

## 🍱 API 目录

> 按添加时间排序。

1. 🌍 60s 读懂世界
1. 🤖️ 小爱同学（支持音频/文字回复，由于官方接口问题，已失效）
1. 🏞️ Bing 每日壁纸
1. 🪙 汇率查询（支持 160+ 货币）
1. 📺 哔哩哔哩实时热搜榜
1. 🦊 微博实时热搜榜
1. ❓ 知乎实时热搜
1. 📰 头条实时热搜
1. 🎵 抖音实时热搜
1. 🎮 Epic 免费游戏
1. ☁️ 全球实时天气预报
1. 🔍 百度百科
1. 📅 历史上的今天
1. 🏅️ 2024 巴黎奥运会奖牌榜
1. ❓ 知乎实时热门问题

## 🎨 返回格式

除特殊说明外，所有 API 均支持返回以下格式：

- `json`（默认）
- `text`

通过 URL 的 `e`/`encode`/`encoding` 参数进行指定。

> 如：[https://60s.viki.moe/60s?v2=1&e=text](https://60s.viki.moe/60s?v2=1&e=text)

## 🧭 使用说明

### 1. 🌍 每天 60s 读懂世界

> 此 API 已发布 v2 格式，规范 JSON 返回，通过 `v2=1` 参数开启，如：[https://60s.viki.moe/60s?v2=1](https://60s.viki.moe/60s?v2=1)

**v2 (推荐)**

- v2 版本 1: [https://60s.viki.moe?v2=1](https://60s.viki.moe?v2=1)
- v2 版本 2: [https://60s.viki.moe/60s?v2=1](https://60s.viki.moe/60s?v2=1)

**v1**

- v1 版本 1: [https://60s.viki.moe](https://60s.viki.moe)
- v1 版本 2: [https://60s.viki.moe/60s](https://60s.viki.moe/60s)

### 2. 🤖️ 小爱同学（由于官方接口问题，已失效）

- [https://60s.viki.moe/xiaoai?text=hello](https://60s.viki.moe/xiaoai?text=hello)
- [https://60s.viki.moe/xiaoai?text=hello&text-only=1](https://60s.viki.moe/xiaoai?text=hello&text-only=1)
- [https://60s.viki.moe/xiaoai?text=hello&e=text](https://60s.viki.moe/xiaoai?text=hello&e=text)

- 参数说明
  - 使用参数 `text` 指定对话内容，同时返回文本和音频链接（音频链接非常长）
  - 设置参数 `text-only` 为 1，指定**仅仅返回文本**，去除音频链接，大大减小返回的文本内容

### 3. 🏞️ Bing 每日壁纸

- [https://60s.viki.moe/bing](https://60s.viki.moe/bing)（默认 JSON 数据）
- [https://60s.viki.moe/bing?e=text](https://60s.viki.moe/bing?e=text) （仅返回图片直链）
- [https://60s.viki.moe/bing?e=image](https://60s.viki.moe/bing?e=image) （重定向到原图直链）
- 每天 16 点更新，支持 `text`/`json`/`image` 三种返回形式。

### 4. 🪙 汇率查询（每天更新，支持 160+ 货币）

- [https://60s.viki.moe/ex-rates?c=USD](https://60s.viki.moe/ex-rates?c=USD)

- 参数说明：使用参数 `c` 指定[货币代码](https://coinyep.com/zh/currencies)，不指定默认为 CNY，货币代码可在[这里](https://coinyep.com/zh/currencies)查询。

### 5. 📺 哔哩哔哩实时热搜榜

- [https://60s.viki.moe/bili](https://60s.viki.moe/bili)

### 6. 🦊 微博实时热搜榜

- [https://60s.viki.moe/weibo](https://60s.viki.moe/weibo)

### 7. ❓ 知乎实时热搜榜

- [https://60s.viki.moe/zhihu](https://60s.viki.moe/zhihu)

### 8. 📰 头条实时热搜榜

- [https://60s.viki.moe/toutiao](https://60s.viki.moe/toutiao)

### 9. 🎵 抖音实时热搜榜

- [https://60s.viki.moe/douyin](https://60s.viki.moe/douyin)

### 10. 🎮 Epic 免费游戏

- [https://60s.viki.moe/epic](https://60s.viki.moe/epic)

### 11. ☁️ 全球实时天气预报（参数支持多语言）

- [https://60s.viki.moe/weather/北京](https://60s.viki.moe/weather/北京)
- [https://60s.viki.moe/weather/beijing](https://60s.viki.moe/weather/beijing)
- [https://60s.viki.moe/weather/beijing?e=text](https://60s.viki.moe/weather/beijing?e=text)

### 12. 🔍 百度百科（支持模糊搜索）

- [https://60s.viki.moe/baike/北京](https://60s.viki.moe/baike/北京)

### 13. 📅 历史上的今天（百度百科数据）

- [https://60s.viki.moe/today_in_history](https://60s.viki.moe/today_in_history)

### 14. 🏅️ 2024 巴黎奥运会奖牌榜

- [https://60s.viki.moe/olympic](https://60s.viki.moe/olympic)
- [https://60s.viki.moe/olympic?e=text](https://60s.viki.moe/olympic?e=text)

### 15. ❓ 知乎实时热门问题

- [https://60s.viki.moe/zhihu-hot](https://60s.viki.moe/zhihu-hot)
- [https://60s.viki.moe/zhihu-hot?e=text](https://60s.viki.moe/zhihu-hot?e=text)

## 💰 赞赏

如果觉得这个项目对你有帮助，欢迎请我喝咖啡 ☕️ ～

> 采取**自愿**原则, 收到的赞赏将用于提高开发者积极性和开发环境。

<div id='readme-reward' style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%">
  <img src="https://smms.viki.moe/2022/11/16/X2kFMdaxvSc1V5P.jpg" alt="wxpay" height="160px"style="margin: 24px;"/>
  <img src="https://smms.viki.moe/2022/11/16/vZ4xkCopKRmIFVX.jpg" alt="alipay" height="160px" style="margin:24px;"/>
</div>

## ❤️ License

[MIT](LICENSE) License © 2022-PRESENT Viki
