# Copilot 指导文档

本文档为 GitHub Copilot 提供项目编码指导，帮助生成符合项目规范的代码。

## 项目概述

60s API 是一个综合性 API 集合，提供新闻、热搜、工具类等多种服务。项目使用 Deno + Oak 框架构建，支持多种运行时环境（Deno、Node.js、Bun）和部署平台（Docker、Cloudflare Workers）。

## 开发命令

```bash
# 开发模式 (端口 4398)
pnpm run dev

# 生产模式
pnpm run start

# Docker 构建和运行
pnpm run docker:build
pnpm run docker:run
```

## 项目架构

### 目录结构
```
src/
├── app.ts              # Oak 应用入口，中间件配置
├── router.ts           # 集中式路由定义（/v2 前缀）
├── common.ts           # 公共工具函数
├── config.ts           # 环境配置
├── middlewares/        # 中间件
│   ├── cors.ts         # 跨域处理
│   ├── encoding.ts     # 响应格式处理
│   └── ...
└── modules/            # API 模块实现
    ├── baidu.module.ts
    ├── weibo.module.ts
    ├── quark.module.ts
    └── ...
```

### 运行时入口
- `deno.ts` - Deno 运行时
- `node.ts` - Node.js 运行时
- `bun.ts` - Bun 运行时
- `cf-worker.ts` - Cloudflare Workers

## 模块开发规范

### 1. 创建新模块

在 `src/modules/` 目录下创建 `[name].module.ts` 文件：

```typescript
import { Common } from '../common.ts'

import type { RouterMiddleware } from '@oak/oak'

// 定义接口类型
interface DataItem {
  id: string
  title: string
  // ... 其他字段使用 snake_case 命名
}

class ServiceExample {
  handle(): RouterMiddleware<'/example'> {
    return async (ctx) => {
      const data = await this.#fetch()

      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = `示例标题\n\n${data
            .slice(0, 20)
            .map((e, i) => `${i + 1}. ${e.title}`)
            .join('\n')}`
          break

        case 'markdown':
          ctx.response.body = `# 示例标题\n\n${data
            .slice(0, 20)
            .map((e, i) => `### ${i + 1}. ${e.title}\n\n---\n`)
            .join('\n')}`
          break

        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(): Promise<DataItem[]> {
    const api = 'https://example.com/api'
    
    const response = await fetch(api, {
      headers: {
        'User-Agent': Common.chromeUA,
      },
    })
    
    const json = await response.json()
    // 处理并返回数据，确保字段使用 snake_case
    return json.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      // 转换驼峰为下划线
      publish_time: item.publishTime,
      source_name: item.sourceName,
    }))
  }
}

export const serviceExample = new ServiceExample()
```

### 2. 注册路由

在 `src/router.ts` 中添加：

```typescript
// 1. 导入模块
import { serviceExample } from './modules/example.module.ts'

// 2. 注册路由
appRouter.get('/example', serviceExample.handle())
```

## 编码规范

### 响应格式

所有 API 必须支持三种编码格式：
- `json`（默认）- 结构化 JSON 响应，通过 `Common.buildJson()` 构建
- `text` - 纯文本格式，用于终端/脚本
- `markdown` - Markdown 格式，用于文档展示

### JSON 字段命名

**重要**：返回的 JSON 字段必须使用 `snake_case` 格式：

```typescript
// ✅ 正确
{
  id: "123",
  title: "标题",
  publish_time: 1234567890,
  source_name: "来源",
  comment_count: 100,
  like_count: 50
}

// ❌ 错误（驼峰命名）
{
  id: "123",
  title: "标题",
  publishTime: 1234567890,  // 应为 publish_time
  sourceName: "来源",        // 应为 source_name
  commentCount: 100,         // 应为 comment_count
  likeCount: 50              // 应为 like_count
}
```

### 数据完整性

**重要**：返回的 JSON 应尽可能提供完整、有帮助的信息：

1. **不要截断数据**：如有完整内容（如 `content`），应清理 HTML 后返回全文
2. **包含所有有用字段**：
   - 基本信息：`id`, `title`, `summary`, `content`
   - 来源信息：`source_name`, `origin_source_name`, `author`
   - 时间信息：`publish_time`, `grab_time`, `modify_time`
   - 媒体资源：`cover`, `images[]`, `videos[]`
   - 分类标签：`category[]`, `tags[]`
   - 互动数据：`comment_count`, `like_count`, `share_count`, `favorite_count`
   - 链接信息：`original_url`

3. **嵌套对象使用 snake_case**：
```typescript
{
  author: {
    name: "作者名",
    desc: "简介",
    icon: "头像URL",
    follower_count: 10000
  },
  images: [{
    url: "图片URL",
    width: 640,
    height: 480,
    type: "jpg",
    description: "图片描述"
  }]
}
```

4. **HTML 内容清理**：
```typescript
#cleanHtml(html: string): string {
  return html
    .replace(/<!--\{(img|video):\d+\}-->/g, '') // 移除占位符
    .replace(/<[^>]+>/g, '')                     // 移除 HTML 标签
    .replace(/&nbsp;/g, ' ')                     // 处理实体
    .replace(/\s+/g, ' ')                        // 清理空白
    .trim()
}
```

### 时间处理

使用 `dayjs` 处理时间：

```typescript
import { dayjs, TZ_SHANGHAI } from './common.ts'

// 当前上海时间
const now = dayjs().tz(TZ_SHANGHAI)

// 格式化
const dateStr = now.format('YYYY-MM-DD')

// 解析时间戳
const time = dayjs(timestamp).tz(TZ_SHANGHAI)
```

### HTTP 请求

```typescript
// 始终使用 Common.chromeUA 作为 User-Agent
const response = await fetch(url, {
  headers: { 'User-Agent': Common.chromeUA }
})
```

### 参数验证

```typescript
// 获取参数
const param = ctx.request.url.searchParams.get('param')

// 必需参数验证
if (!param) {
  Common.requireArguments('param', ctx.response)
  return
}
```

### 错误处理

```typescript
// 成功响应
ctx.response.body = Common.buildJson(data)

// 错误响应
ctx.response.status = 400
ctx.response.body = Common.buildJson(null, 400, '错误信息')
```

## 常用工具函数

| 函数 | 说明 |
|------|------|
| `Common.buildJson(data, code?, message?)` | 构建标准 JSON 响应 |
| `Common.requireArguments(name, response)` | 参数验证 |
| `Common.chromeUA` | Chrome User-Agent 字符串 |
| `Common.localeTime(timestamp)` | 格式化时间 |
| `Common.randomInt(min, max)` | 随机整数 |
| `Common.randomItem(array)` | 随机数组元素 |
| `Common.md5(str)` | MD5 哈希 |
| `Common.qs(obj)` | 构建查询字符串 |

## 代码质量

- **类型安全**：使用 TypeScript 类型，避免使用 `any`
- **错误处理**：处理 fetch 错误和无效响应
- **参数验证**：使用 `Common.requireArguments()` 验证必需参数
- **代码一致性**：遵循 `src/modules/` 中现有代码模式
- **注释文档**：为复杂函数添加 JSDoc 注释
- **测试覆盖**：测试所有编码格式（json/text/markdown）

## 示例：夸克热点 API

参考 `src/modules/quark.module.ts` 作为新模块的模板：

```typescript
import { Common } from '../common.ts'
import type { RouterMiddleware } from '@oak/oak'

interface QuarkHotItem {
  id: string
  title: string
  summary: string
  source_name: string     // snake_case
  publish_time: number    // snake_case
  cover: string
  category: string[]
  tags: string[]
  comment_count: number   // snake_case
  like_count: number      // snake_case
}

class ServiceQuark {
  handle(): RouterMiddleware<'/quark'> {
    return async (ctx) => {
      const data = await this.#fetch()
      
      switch (ctx.state.encoding) {
        case 'text':
          // 纯文本格式
          break
        case 'markdown':
          // Markdown 格式
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(data)
          break
      }
    }
  }

  async #fetch(): Promise<QuarkHotItem[]> {
    // 获取并处理数据
  }
}

export const serviceQuark = new ServiceQuark()
```

## 快速检查清单

添加新 API 时，确保：

- [ ] 模块文件创建在 `src/modules/` 目录
- [ ] 类名遵循 `ServiceXxx` 命名规范
- [ ] 导出实例遵循 `serviceXxx` 命名规范
- [ ] JSON 返回字段使用 `snake_case` 格式
- [ ] 支持 `json`、`text`、`markdown` 三种编码格式
- [ ] 使用 `Common.buildJson()` 构建 JSON 响应
- [ ] HTTP 请求使用 `Common.chromeUA`
- [ ] 在 `src/router.ts` 中注册路由
- [ ] 无 TypeScript 编译错误
