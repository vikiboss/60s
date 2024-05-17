# ⏰ 60s API

60s API，不仅仅是每天 60s 读懂世界～ 灵感来源详情请参考[这篇文章](https://xlog.viki.moe/60s)。

这是一个使用 [Deno](https://deno.com/) 构建的简单 API 项目列表，你可以参考[这里](https://github.com/vikiboss/60s/issues/2#issuecomment-1765769220)自行部署。

> 60s 数据目前来源于这个[知乎专栏](https://www.zhihu.com/column/c_1715391799055720448)，原专栏在[这里](https://www.zhihu.com/column/c_1261258401923026944)，但是原专栏已不在知乎更新，这个新的专栏貌似是搬运的，希望它能坚持更新下去吧 🙏。

## 🪵 API 目录

- 🌍 60s 读懂世界
- 🤖️ 小爱同学（支持音频/文字回复，由于官方接口问题，已失效）
- 🏞️ Bing 每日壁纸
- 🪙 汇率查询（支持 160+ 货币）
- 📺 哔哩哔哩实时热搜榜
- 🦊 微博实时热搜榜
- ❓ 知乎实时热搜
- 📰 头条实时热搜
- 🎵 抖音实时热搜
- 🎮 Epic 免费游戏
- ☁️ 全球实时天气预报

## 🎨 返回格式

除特殊说明外，所有 API 均支持返回以下格式：

- `json`（默认）
- `text`

通过 URL 的 `e`/`encode`/`encoding` 参数进行指定。

比如：[https://60s.viki.moe/60s?e=text](https://60s.viki.moe/60s?e=text)

## 🧭 使用说明

**1. 🌍 每天 60s 读懂世界（建议使用 v2 格式）**

> 此 API 已发布 v2 格式，规范 JSON 返回，通过 `v2=1` 参数开启，如：[https://60s.viki.moe/60s?v2=1](https://60s.viki.moe/60s?v2=1)

- [https://60s.viki.moe](https://60s.viki.moe)
- [https://60s.viki.moe/60s](https://60s.viki.moe/60s)

**2. 🤖️ 小爱同学（由于官方接口问题，已失效）**

- [https://60s.viki.moe/xiaoai?text=hello](https://60s.viki.moe/xiaoai?text=hello)
- [https://60s.viki.moe/xiaoai?text=hello&text-only=1](https://60s.viki.moe/xiaoai?text=hello&text-only=1)
- [https://60s.viki.moe/xiaoai?text=hello&e=text](https://60s.viki.moe/xiaoai?text=hello&e=text)

- 参数说明
  - 使用参数 `text` 指定对话内容，同时返回文本和音频链接（音频链接非常长）
  - 设置参数 `text-only` 为 1，指定**仅仅返回文本**，去除音频链接，大大减小返回的文本内容

**3. 🏞️ Bing 每日壁纸**

- [https://60s.viki.moe/bing](https://60s.viki.moe/bing)（默认 JSON 数据）
- [https://60s.viki.moe/bing?e=text](https://60s.viki.moe/bing?e=text) （仅返回图片直链）
- [https://60s.viki.moe/bing?e=image](https://60s.viki.moe/bing?e=image) （重定向到原图直链）
- 每天 16 点更新，支持 `text`/`json`/`image` 三种返回形式。

**4. 🪙 汇率查询（每天更新，支持 160+ 货币）**

- [https://60s.viki.moe/ex-rates?c=USD](https://60s.viki.moe/ex-rates?c=USD)

- 参数说明：使用参数 `c` 指定[货币代码](https://coinyep.com/zh/currencies)，不指定默认为 CNY，货币代码可在[这里](https://coinyep.com/zh/currencies)查询。

**5. 📺 哔哩哔哩实时热搜榜**

- [https://60s.viki.moe/bili](https://60s.viki.moe/bili)

**6. 🦊 微博实时热搜榜**

- [https://60s.viki.moe/weibo](https://60s.viki.moe/weibo)

**7. ❓ 知乎实时热搜榜**

- [https://60s.viki.moe/zhihu](https://60s.viki.moe/zhihu)

**8. 📰 头条实时热搜榜**

- [https://60s.viki.moe/toutiao](https://60s.viki.moe/toutiao)

**8. 🎵 抖音实时热搜榜**

- [https://60s.viki.moe/douyin](https://60s.viki.moe/douyin)
- 
**9. 🎮 Epic 免费游戏**

- [https://60s.viki.moe/epic](https://60s.viki.moe/epic)

**9. ☁️ 全球实时天气预报（参数支持多语言）**

- [https://60s.viki.moe/weather/北京](https://60s.viki.moe/weather/北京)
- [https://60s.viki.moe/weather/beijing](https://60s.viki.moe/weather/%E5%8C%97%E4%BA%AC)
- [https://60s.viki.moe/weather/beijing?e=text](https://60s.viki.moe/weather/%E5%8C%97%E4%BA%AC?e=text)

## ❤️ License

[MIT](LICENSE) License © 2022-PRESENT Viki
