# 60s

60s API，不仅是每天 60s 读懂世界。

> 60s 数据来源于[知乎专栏](https://www.zhihu.com/column/c_1261258401923026944)，详情参考[这篇文章](https://xlog.viki.moe/60s)。

### API 列表

**1. 每天 60s 读懂世界**

- [60s.viki.moe](https://60s.viki.moe)
- [60s.viki.moe/60s](https://60s.viki.moe/60s)

**2. 哔哩哔哩实时热搜榜**

- [60s.viki.moe/bili](https://60s.viki.moe/bili)

**3. 微博实时热搜榜**

- [60s.viki.moe/weibo](https://60s.viki.moe/weibo)

**4. 汇率查询（每天更新，支持 160+ 货币）**

- [60s.viki.moe/ex-rates?c=USD](https://60s.viki.moe/ex-rates?c=USD)

参数说明：使用 `c` 参数指定[货币代码](https://coinyep.com/zh/currencies)，不指定默认为 CNY，货币代码可在[这里](https://coinyep.com/zh/currencies)查询。

**5. Bing 每日壁纸**

- [60s.viki.moe/bing](https://60s.viki.moe/bing)（默认 JSON 数据）
- [60s.viki.moe/bing?e=image](https://60s.viki.moe/bing?e=image) （重定向到原图直链）

壁纸支持 `json` 和 `image` 两种返回形式。

### 返回格式

所有 API 均支持返回以下两种格式：

- `json`（默认）
- `text`

将 URL 的 `encoding`/`encode`/`e` 参数设置为 `text` 以返回纯文本。如：[https://60s.viki.moe/60s?e=text](https://60s.viki.moe/60s?e=text)
