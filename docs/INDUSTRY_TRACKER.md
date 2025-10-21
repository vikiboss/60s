# 行业信息追踪模块

> ⚠️ **实验性功能** - 这些API依赖第三方服务，请先测试后再用于生产环境

每日行业信息追踪功能已添加到本项目，可以实时获取科技、AI等行业的最新资讯。

## 🧪 测试API可用性

部署后请先运行测试脚本验证API是否可用：

```bash
# 启动服务
npm run dev

# 在另一个终端运行测试
node --no-warnings --experimental-transform-types scripts/test-industry-apis.ts
```

测试脚本会检查所有API并输出详细的测试结果。

## 📡 可用接口

### 1. 掘金热门文章

获取掘金技术社区热门文章

**接口地址：** `GET /v2/industry/juejin`

**参数：**
- `encoding` (可选): 返回格式，可选值为 `json`（默认）或 `text`

**示例：**
```bash
# JSON格式
curl https://your-domain.com/v2/industry/juejin

# 文本格式
curl https://your-domain.com/v2/industry/juejin?encoding=text
```

**返回示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "7123456789",
      "title": "深入理解 React 18 新特性",
      "description": "本文详细介绍了 React 18 的新特性...",
      "link": "https://juejin.cn/post/7123456789",
      "cover": "封面图片URL",
      "author": "作者名",
      "likes": 1234,
      "views": 5678,
      "comments": 89,
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

获取AI领域最新热门文章（来自掘金AI标签）

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
      "id": "7123456789",
      "title": "GPT-4 实战应用指南",
      "description": "详细描述...",
      "link": "https://juejin.cn/post/7123456789",
      "cover": "封面图片URL",
      "source": "掘金",
      "author": "AI技术专家",
      "likes": 1234,
      "views": 5678,
      "published_at": 1234567890,
      "published": "2025/10/21 12:00:00",
      "tags": ["AI", "GPT", "机器学习"]
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

### 技术社区聚合
```bash
# 获取多个技术资讯源
curl https://your-domain.com/v2/industry/juejin
curl https://your-domain.com/v2/industry/ai-news
curl https://your-domain.com/v2/industry/v2ex
```

### 开发者日报
```bash
# 构建每日开发者资讯
curl https://your-domain.com/v2/industry/github-trending?since=daily
curl https://your-domain.com/v2/industry/juejin
curl https://your-domain.com/v2/industry/v2ex
```

### 特定领域追踪
```bash
# 追踪Python生态
curl https://your-domain.com/v2/industry/github-trending?lang=python

# 追踪AI技术
curl https://your-domain.com/v2/industry/ai-news
```

---

## 📊 数据更新频率

- **掘金热门文章**: 缓存30分钟
- **GitHub Trending**: 缓存1小时
- **AI技术资讯**: 缓存30分钟
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

### ⚠️ 重要：请先测试

这些API是**实验性功能**，基于第三方服务实现。**强烈建议**在生产环境使用前先运行测试脚本验证可用性。

### 数据源说明

1. **掘金API**（实验性）:
   - 使用端点：`https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed`
   - 状态：基于实际案例，但未经充分验证
   - 风险：可能需要调整参数或端点

2. **GitHub Trending**（实验性）:
   - 主要服务：`ghtrending.vercel.app`
   - 备选服务：`github-trending.vercel.app`
   - 状态：使用开源第三方服务，支持自行部署
   - 风险：依赖外部Vercel部署，可能不稳定

3. **V2EX**（相对稳定）:
   - 使用端点：`https://www.v2ex.com/api/topics/hot.json`
   - 状态：官方API，经过验证
   - 限制：120次/小时，频繁访问可能403

4. **AI资讯**（实验性）:
   - 使用端点：掘金AI标签推荐
   - 状态：基于掘金API，未经验证

### 其他注意事项

- **速率限制**: 请求频率过高可能被上游限流
- **容错机制**: 所有接口都有缓存降级策略
- **日志输出**: 控制台会输出详细的API调用日志，便于调试

---

## 🚀 后续计划

- [ ] 添加更多行业资讯源（财经、游戏、电商等）
- [ ] 支持自定义订阅和过滤
- [ ] 添加资讯摘要和关键词提取
- [ ] 支持RSS输出格式
- [ ] 添加历史数据查询
