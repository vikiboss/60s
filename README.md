# 60s

60s API，不仅是每天 60s 读懂世界。

> 60s 数据来源于[知乎专栏](https://www.zhihu.com/column/c_1261258401923026944)，详情参考[这篇文章](https://xlog.viki.moe/60s)。

## API 目录

- [60s 读懂世界](https://60s.viki.moe/60s)
- [哔哩哔哩实时热搜榜](https://60s.viki.moe/bili)
- [微博实时热搜榜](https://60s.viki.moe/weibo)
- [汇率查询（支持 160+ 货币）](https://60s.viki.moe/ex-rates?c=USD)
- [Bing 每日壁纸](https://60s.viki.moe/bing)

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

**2. 哔哩哔哩实时热搜榜**

- [60s.viki.moe/bili](https://60s.viki.moe/bili)

**3. 微博实时热搜榜**

- [60s.viki.moe/weibo](https://60s.viki.moe/weibo)

**4. 汇率查询（每天更新，支持 160+ 货币）**

- [60s.viki.moe/ex-rates?c=USD](https://60s.viki.moe/ex-rates?c=USD)

- 参数说明：使用参数 `c` 指定[货币代码](https://coinyep.com/zh/currencies)，不指定默认为 CNY，货币代码可在[这里](https://coinyep.com/zh/currencies)查询。

**5. Bing 每日壁纸**

- [60s.viki.moe/bing](https://60s.viki.moe/bing)（默认 JSON 数据）
- [60s.viki.moe/bing?e=image](https://60s.viki.moe/bing?e=image) （重定向到原图直链）
- 每天 16 点更新，支持 `text`/`json`/`image` 三种返回形式。
