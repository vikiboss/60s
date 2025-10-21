# 行业信息追踪模块

每日行业信息追踪功能已添加到本项目，可以实时获取科技、AI等行业的最新资讯。

## 📡 可用接口

### 1. 36氪科技快讯

获取36氪最新科技资讯

**接口地址：** `GET /v2/industry/tech-36kr`

**参数：**
- `encoding` (可选): 返回格式，可选值为 `json`（默认）或 `text`

**示例：**
```bash
# JSON格式
curl https://your-domain.com/v2/industry/tech-36kr

# 文本格式
curl https://your-domain.com/v2/industry/tech-36kr?encoding=text
```

**返回示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 123456,
      "title": "某科技公司发布新产品",
      "description": "详细描述...",
      "link": "https://www.36kr.com/p/123456",
      "cover": "封面图片URL",
      "published_at": 1234567890,
      "published": "2025/10/21 12:00:00"
    }
  ]
}
```

---

### 2. GitHub Trending 热门项目

获取GitHub每日/每周/每月热门开源项目

**接口地址：** `GET /v2/industry/github-trending`

**参数：**
- `lang` (可选): 编程语言，如 `javascript`、`python`、`go` 等
- `since` (可选): 时间范围，可选值为 `daily`（默认）、`weekly`、`monthly`
- `encoding` (可选): 返回格式，可选值为 `json`（默认）或 `text`

**示例：**
```bash
# 获取今日所有语言热门项目
curl https://your-domain.com/v2/industry/github-trending

# 获取今日JavaScript热门项目
curl https://your-domain.com/v2/industry/github-trending?lang=javascript

# 获取本周Python热门项目
curl https://your-domain.com/v2/industry/github-trending?lang=python&since=weekly
```

**返回示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "repo": "user/repo-name",
      "author": "user",
      "name": "repo-name",
      "description": "项目描述",
      "link": "https://github.com/user/repo-name",
      "language": "JavaScript",
      "stars": 12345,
      "forks": 678,
      "currentPeriodStars": 123,
      "builtBy": []
    }
  ]
}
```

---

### 3. AI 行业资讯

获取AI领域最新资讯动态

**接口地址：** `GET /v2/industry/ai-news`

**参数：**
- `encoding` (可选): 返回格式，可选值为 `json`（默认）或 `text`

**示例：**
```bash
# JSON格式
curl https://your-domain.com/v2/industry/ai-news

# 文本格式
curl https://your-domain.com/v2/industry/ai-news?encoding=text
```

**返回示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 123456,
      "title": "某AI模型发布新版本",
      "description": "详细描述...",
      "link": "https://www.36kr.com/p/123456",
      "cover": "封面图片URL",
      "source": "36氪",
      "published_at": 1234567890,
      "published": "2025/10/21 12:00:00",
      "tags": ["AI", "机器学习"]
    }
  ]
}
```

---

### 4. V2EX 技术社区热帖

获取V2EX技术社区热门讨论话题

**接口地址：** `GET /v2/industry/v2ex`

**参数：**
- `encoding` (可选): 返回格式，可选值为 `json`（默认）或 `text`

**示例：**
```bash
# JSON格式
curl https://your-domain.com/v2/industry/v2ex

# 文本格式
curl https://your-domain.com/v2/industry/v2ex?encoding=text
```

**返回示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 123456,
      "title": "讨论话题标题",
      "content": "话题内容...",
      "link": "https://www.v2ex.com/t/123456",
      "node": "程序员",
      "node_name": "programmer",
      "member": "username",
      "replies": 42,
      "created": 1234567890,
      "last_modified": 1234567890
    }
  ]
}
```

---

## 🎯 使用场景

### 科技媒体聚合
```bash
# 获取多个科技资讯源
curl https://your-domain.com/v2/industry/tech-36kr
curl https://your-domain.com/v2/industry/ai-news
```

### 开发者日报
```bash
# 构建每日开发者资讯
curl https://your-domain.com/v2/industry/github-trending?since=daily
curl https://your-domain.com/v2/industry/v2ex
```

### 特定领域追踪
```bash
# 追踪Python生态
curl https://your-domain.com/v2/industry/github-trending?lang=python

# 追踪AI行业
curl https://your-domain.com/v2/industry/ai-news
```

---

## 📊 数据更新频率

- **36氪科技快讯**: 缓存30分钟
- **GitHub Trending**: 缓存1小时
- **AI行业资讯**: 缓存30分钟
- **V2EX热帖**: 缓存10分钟

---

## 🔧 技术细节

所有接口均支持：
- ✅ 智能缓存机制，减少上游API调用
- ✅ 失败时返回旧缓存数据（如有）
- ✅ 统一的错误处理
- ✅ JSON和文本两种输出格式
- ✅ 跨域支持（CORS）

---

## 📝 注意事项

1. 所有接口都依赖第三方数据源，可能会因为上游API变化而失效
2. 请求频率过高可能会被上游限流
3. 建议在生产环境中添加自己的缓存层
4. GitHub Trending使用第三方API服务，稳定性依赖该服务

---

## 🚀 后续计划

- [ ] 添加更多行业资讯源（财经、游戏、电商等）
- [ ] 支持自定义订阅和过滤
- [ ] 添加资讯摘要和关键词提取
- [ ] 支持RSS输出格式
- [ ] 添加历史数据查询
