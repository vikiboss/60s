# ⏰ 60s API

不仅仅是每天 60 秒读懂世界～



这是一个使用 [Deno](https://deno.com/) 构建的简单 API 列表项目，动机请参考[这篇文章](https://xlog.viki.moe/60s)。你也可以参考[这里](https://github.com/vikiboss/60s/issues/2#issuecomment-1765769220)自行部署。

如果需要自己部署，推荐使用 [Deno Deploy](https://deno.com/deploy)，不仅免费、全球加速，还支持绑定自定义域名～

> 每天 60 秒读懂世界 API 的数据目前来源于[这个](https://www.zhihu.com/column/c_1715391799055720448)知乎专栏，原专栏在[这里](https://www.zhihu.com/column/c_1261258401923026944)，但是原专栏已不在知乎更新，这个新的专栏貌似是搬运的，希望它能坚持更新下去吧 🙏。

## 🪵 API 目录

> 按添加时间排序。

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
- 🔍 百度百科
- 📅 历史上的今天

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

**9. 🎵 抖音实时热搜榜**

- [https://60s.viki.moe/douyin](https://60s.viki.moe/douyin)

**10. 🎮 Epic 免费游戏**

- [https://60s.viki.moe/epic](https://60s.viki.moe/epic)

**11. ☁️ 全球实时天气预报（参数支持多语言）**

- [https://60s.viki.moe/weather/北京](https://60s.viki.moe/weather/北京)
- [https://60s.viki.moe/weather/beijing](https://60s.viki.moe/weather/%E5%8C%97%E4%BA%AC)
- [https://60s.viki.moe/weather/beijing?e=text](https://60s.viki.moe/weather/%E5%8C%97%E4%BA%AC?e=text)

**12. 🔍 百度百科（支持模糊搜索）**

- [https://60s.viki.moe/baike/北京](https://60s.viki.moe/baike/北京)
- [https://60s.viki.moe/baike/beijing](https://60s.viki.moe/baike/%E5%8C%97%E4%BA%AC)

**13. 📅 历史上的今天（百度百科数据）**

- [https://60s.viki.moe/today_in_history](https://60s.viki.moe/today_in_history)

## 💰 赞赏

如果觉得这个项目对你有帮助，不管是学习、工作还是生活，欢迎请我吃冰淇淋～

> 赞赏采取**自愿**原则, 收到的赞赏将用于提高开发者积极性和开发环境。

<div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%">
  <img src="https://smms.viki.moe/2022/11/16/X2kFMdaxvSc1V5P.jpg" alt="wxpay" height="160px"style="margin: 24px; border-radius: 8px"/>
  <img src="https://smms.viki.moe/2022/11/16/vZ4xkCopKRmIFVX.jpg" alt="alipay" height="160px" style="margin:24px; border-radius: 8px"/>
</div>


## ❤️ License

[MIT](LICENSE) License © 2022-PRESENT Viki
