# 60s

60s API，不仅是每天 60s 读懂世界。

> 60s 数据来源于[知乎专栏](https://www.zhihu.com/column/c_1261258401923026944)，详情参考[这篇文章](https://xlog.viki.moe/60s)。

## API 目录

- [60s 读懂世界](https://60s.viki.moe/60s)
- [小爱同学](https://60s.viki.moe/xiaoai)
- [Bing 每日壁纸](https://60s.viki.moe/bing)
- [汇率查询（支持 160+ 货币）](https://60s.viki.moe/ex-rates?c=USD)
- [哔哩哔哩实时热搜榜](https://60s.viki.moe/bili)
- [微博实时热搜榜](https://60s.viki.moe/weibo)
- [知乎实时热搜](https://60s.viki.moe/zhihu)
- [头条实时热搜](https://60s.viki.moe/toutiao)

## 返回格式

除特殊说明外，所有 API 均支持返回以下格式：

- `json`（默认）
- `text`

通过 URL 的 `e`/`encode`/`encoding` 参数进行指定。

比如：[https://60s.viki.moe/60s?e=text](https://60s.viki.moe/60s?e=text)

## 使用说明

**1. 每天 60s 读懂世界**

- [60s.viki.moe](https://60s.viki.moe)
- [60s.viki.moe/60s](https://60s.viki.moe/60s)

**2.小爱同学**

- [60s.viki.moe/xiaoai?text=hello](https://60s.viki.moe/xiaoai?text=hello)
- [60s.viki.moe/xiaoai?text=hello&text-only=1](https://60s.viki.moe/xiaoai?text=hello&text-only=1)
- [60s.viki.moe/xiaoai?text=hello&e=text](https://60s.viki.moe/xiaoai?text=hello&e=text)

- 参数说明
  - 使用参数 `text` 指定对话内容，同时返回文本和音频链接（音频链接非常长）
  - 设置参数 `text-only` 为 1，指定**仅仅返回文本**，去除音频链接，大大减小返回的文本内容

**3. Bing 每日壁纸**

- [60s.viki.moe/bing](https://60s.viki.moe/bing)（默认 JSON 数据）
- [60s.viki.moe/bing?e=text](https://60s.viki.moe/bing?e=text) （仅返回图片直链）
- [60s.viki.moe/bing?e=image](https://60s.viki.moe/bing?e=image) （重定向到原图直链）
- 每天 16 点更新，支持 `text`/`json`/`image` 三种返回形式。

**4. 汇率查询（每天更新，支持 160+ 货币）**

- [60s.viki.moe/ex-rates?c=USD](https://60s.viki.moe/ex-rates?c=USD)

- 参数说明：使用参数 `c` 指定[货币代码](https://coinyep.com/zh/currencies)，不指定默认为 CNY，货币代码可在[这里](https://coinyep.com/zh/currencies)查询。

**5. 哔哩哔哩实时热搜榜**

- [60s.viki.moe/bili](https://60s.viki.moe/bili)

**6. 微博实时热搜榜**

- [60s.viki.moe/weibo](https://60s.viki.moe/weibo)

**7. 知乎实时热搜榜**

- [60s.viki.moe/zhihu](https://60s.viki.moe/zhihu)

**8. 头条实时热搜榜**

- [60s.viki.moe/toutiao](https://60s.viki.moe/toutiao)

## License

[MIT](LICENSE) License © 2022-PRESENT Viki

