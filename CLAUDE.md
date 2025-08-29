# 📚 60s API 项目上下文文档

> Claude Code 会话恢复用文档 - 包含项目结构、开发规范、技术约定等关键信息

## 🎯 项目概述

### 核心定位
- **项目名称**: 60s API - 高质量开放 API 集合
- **核心功能**: "每天60秒读懂世界" 新闻API，同时提供30+个不同类型的API服务
- **技术理念**: 权威数据源 + 毫秒级响应 + 开发者友好
- **主要特色**: 全球CDN加速、多运行时支持、统一API设计、智能缓存

### 项目规模
- **当前版本**: v2.21.1
- **API数量**: 30+个端点
- **支持运行时**: Deno(主要)、Node.js、Bun、Cloudflare Workers
- **部署方式**: Deno Deploy(生产)、Docker、本地开发

---

## 🏗️ 技术架构

### 技术栈
```
运行时: Deno (主推) / Node.js / Bun / Cloudflare Workers
框架: @oak/oak (Deno 的 Koa 风格 Web 框架)  
语言: TypeScript (严格模式)
依赖管理: pnpm (主要) / deno install / bun install
部署: Deno Deploy / Docker / Cloudflare Workers
```

### 核心依赖
```json
{
  "@oak/oak": "^17.1.4",        // Web 框架 (Oak - Deno 的 Koa 风格框架)
  "cheerio": "^1.1.2",          // HTML 解析 (类 jQuery，用于网页抓取)
  "dayjs": "^1.11.13",          // 日期时间处理 (轻量级 moment.js 替代)
  "tyme4ts": "^1.3.4",          // 农历日期转换 (中国传统日历支持)
  "filesize": "^11.0.2",        // 文件大小格式化
  "yaqrcode": "^0.2.1"          // 二维码生成
}
```

### 项目结构
```
60s/
├── src/
│   ├── app.ts                 // 应用主入口 (中间件装配)
│   ├── router.ts              // 路由配置 (核心文件 - 所有API路由定义)
│   ├── common.ts              // 公共工具类 (参数获取、日期格式化、加密等)
│   ├── config.ts              // 配置管理 (环境变量、常量定义)
│   ├── middlewares/           // 中间件目录
│   │   ├── cors.ts           // CORS 跨域处理
│   │   ├── encoding.ts       // 编码格式处理 (json/text/image)
│   │   ├── debug.ts          // 调试信息中间件
│   │   ├── blacklist.ts      // IP黑名单
│   │   ├── favicon.ts        // favicon处理
│   │   ├── handle-global-error.ts // 全局错误处理
│   │   └── not-found.ts      // 404处理
│   └── modules/              // API 模块目录 (按功能分类)
│       ├── 60s.module.ts     // 核心"每天60s看世界"模块
│       ├── awesome-js/       // JavaScript资源模块
│       ├── answer/           // 答案之书模块
│       ├── duanzi/           // 段子模块
│       ├── fanyi/            // 翻译模块
│       ├── hitokoto/         // 一言语录模块
│       ├── luck/             // 运势模块
│       ├── lunar/            // 农历转换模块
│       ├── qrcode/           // 二维码生成模块
│       └── ...               // 其他30+个API模块
├── scripts/                  // 工具脚本
│   ├── parse-js-questions.ts // JS问题解析脚本
│   └── write-update-time.ts  // 更新时间写入脚本
├── test/                     // 测试文件
├── images/                   // 项目图片资源
├── drafts/                   // 草稿文档
├── deno.ts                   // Deno 运行时启动文件
├── node.ts                   // Node.js 运行时启动文件  
├── bun.ts                    // Bun 运行时启动文件
├── cf-worker.ts              // Cloudflare Workers 入口
├── package.json              // Node.js/npm 项目配置
├── deno.json                 // Deno 项目配置
├── tsconfig.json             // TypeScript 配置
├── wrangler.toml             // Cloudflare Workers 配置
├── Dockerfile                // Docker 构建配置
└── prettier.config.mjs       // 代码格式化配置
```

---

## 🔧 开发规范

### API 实现模式
每个API模块遵循统一模式:

```typescript
// 标准模块结构
class ServiceXxx {
  handle(): RouterMiddleware<'/endpoint'> {
    return async (ctx) => {
      // 1. 参数获取
      const param = await Common.getParam('param', ctx.request)
      
      // 2. 数据处理
      const result = await processData(param)
      
      // 3. 响应格式化
      switch (ctx.state.encoding) {
        case 'text':
          ctx.response.body = formatAsText(result)
          break
        case 'json':
        default:
          ctx.response.body = Common.buildJson(result)
          break
      }
    }
  }
}

export const serviceXxx = new ServiceXxx()
```

### 路由注册规范
在 `src/router.ts` 中:
```typescript
// 1. 导入模块
import { serviceXxx } from './modules/xxx.module.ts'

// 2. 注册路由 (统一前缀 /v2)
appRouter.get('/xxx', serviceXxx.handle())
```

### 响应格式约定
```typescript
// 成功响应格式 (统一JSON结构)
{
  "code": 200,
  "message": "获取成功。数据来自官方/权威源头，以确保稳定与实时。开源地址 https://github.com/vikiboss/60s，反馈群 595941841",
  "data": { /* 实际数据 */ },
  "__debug__": { /* 调试信息 - 仅开发环境 */ }
}

// 错误响应格式
{
  "code": 400,
  "message": "参数 xxx 不能为空，可以是 GET 请求的 query 参数或 POST 请求的 body JSON 参数。query 参数请进行必要的 URL 编码",
  "data": null
}

// 支持的编码格式 (通过 ?encoding 参数控制)
?encoding=json         // JSON格式 (默认)
?encoding=text         // 纯文本格式
?encoding=image        // 图片重定向 (特定API如60s)
?encoding=image-proxy  // 图片代理 (特定API)
```

### 公共工具使用 (Common 类)
```typescript
// 1. 参数获取 (智能获取GET query和POST body参数)
const param = await Common.getParam('paramName', ctx.request)

// 2. 响应构建 (统一JSON响应格式)
ctx.response.body = Common.buildJson(data, code?, message?)

// 3. 参数校验和错误响应
if (!param) {
  Common.requireArguments('paramName', ctx)
  return
}

// 4. 随机选择工具
const randomItem = Common.randomItem(array)
const randomInt = Common.randomInt(min, max)

// 5. 日期时间格式化 (支持时区)
const dateStr = Common.localeDate(timestamp)  // 格式: 2025/08/27
const timeStr = Common.localeTime(timestamp)  // 格式: 2025/08/27 15:30:45

// 6. 字符串处理
const encoded = Common.transformEntities(str, 'ascii2unicode')
const hash = Common.md5(text, 'hex')

// 7. URL查询字符串构建
const queryStr = Common.qs({ key: value, arr: [1, 2, 3] })

// 8. 开发环境代理URL (避免CORS)
const proxiedUrl = Common.useProxiedUrl(originalUrl)

// 9. 获取API基础信息
const apiInfo = Common.getApiInfo()
```

---

## 📊 当前API分类概览

### 核心特色API
- `GET /v2/60s` - **🌟 每天60秒读懂世界** (项目核心功能)

### 信息资讯类
- `GET /v2/bing` - 必应每日壁纸
- `GET /v2/today_in_history` - 历史上的今天
- `GET /v2/ai-news` - AI快讯
- `GET /v2/exchange_rate` - 汇率查询
- `GET /v2/hacker-news` - Hacker News 前沿资讯

### 热门榜单类
- `GET /v2/bili` - 哔哩哔哩热搜
- `GET /v2/weibo` - 微博热搜
- `GET /v2/zhihu` - 知乎热榜
- `GET /v2/douyin` - 抖音热搜
- `GET /v2/toutiao` - 头条热搜
- `GET /v2/maoyan` - 猫眼票房

### 实用工具类
- `ALL /v2/fanyi` + `/v2/fanyi/langs` - 多语言翻译
- `GET /v2/weather` + `/v2/weather/forecast` - 天气查询
- `GET /v2/ip` - IP查询和归属地
- `GET /v2/lunar` - 农历转换
- `GET /v2/baike` - 百科知识查询
- `GET /v2/epic` - Epic免费游戏
- `ALL /v2/og` - OG信息提取
- `ALL /v2/hash` - 哈希编码工具
- `GET /v2/qrcode` - 二维码生成

### 学习编程类
- `GET /v2/awesome-js` - JavaScript优秀资源
- `GET /v2/ncm-rank` - 网易云音乐榜单
- `GET /v2/ncm-rank/:id` - 网易云音乐榜单详情

### 趣味娱乐类
- `GET /v2/kfc` - KFC疯狂星期四段子
- `GET /v2/hitokoto` - 一言语录  
- `GET /v2/luck` - 今日运势
- `GET /v2/chemical` - 化学元素
- `GET /v2/changya` - 唱歌音频
- `GET /v2/duanzi` - 搞笑段子
- `GET /v2/fabing` - 发病文学
- `GET /v2/answer` - 答案之书
- `GET /v2/dad-joke` - 冷笑话（谐音梗）

> **注意**: API具体数量和分类会动态更新，以实际 `/v2/router.ts` 文件中的路由定义为准

---

## 🚀 部署配置

### 环境变量
```bash
HOST=0.0.0.0                    # 监听地址
PORT=4399                       # 端口号
DEBUG=1                         # 调试模式
ENCODING_PARAM_NAME=encoding    # 编码参数名
DEV=1                          # 开发环境标识
```

### 启动命令
```bash
# 开发环境 (推荐使用Node.js)
npm run dev        # Node.js 开发模式 (端口4398，热重载)
deno run -A deno.ts # Deno 开发模式

# 生产环境  
npm start          # Node.js 生产模式 (端口4398)
deno run -A deno.ts # Deno 生产模式 (端口4399)

# Docker 部署
npm run docker:build   # 构建镜像
npm run docker:run     # 运行容器
npm run docker:re-run  # 重新运行容器

# 多运行时支持测试
bun run bun.ts         # Bun 运行时
wrangler dev cf-worker.ts # Cloudflare Workers 本地开发
```

### 多运行时入口文件
- `deno.ts` - Deno 运行时入口
- `node.ts` - Node.js 运行时入口 (需要 v22.6+)
- `bun.ts` - Bun 运行时入口
- `cf-worker.ts` - Cloudflare Workers 入口

---

## 📁 数据文件约定

### 静态数据结构
```
src/modules/[module-name]/
├── [module-name].module.ts   // 模块主文件
├── [module-name].json        // 静态数据文件
└── ...                       // 其他相关文件
```

### 数据更新机制
- **外部数据**: 通过 GitHub Actions 定时抓取并生成静态JSON
- **实时数据**: API调用时实时获取
- **缓存策略**: 内置智能缓存，毫秒级响应

---

## 🛠️ 开发工作流

### 添加新API的标准流程
1. **创建模块目录**: `src/modules/new-api/`
2. **实现模块类**: 遵循 `ServiceXxx` 模式
3. **注册路由**: 在 `src/router.ts` 中添加路由
4. **更新README**: 按分类添加到API目录表格
5. **测试验证**: 本地测试各种参数和格式

### 代码风格约定
- **TypeScript 严格模式**: 启用所有严格检查 (`strict: true`)
- **ES模块**: 使用 `import/export`，支持 `with { type: 'json' }` JSON导入
- **无注释策略**: 代码自文档化，变量/函数命名清晰，仅在必要时添加注释
- **函数式编程**: 优先使用纯函数和不可变数据结构
- **统一命名**: 
  - 服务类: `ServiceXxx` (如 `Service60s`)  
  - 导出实例: `serviceXxx` (如 `service60s`)
  - 文件命名: `xxx.module.ts` (API模块) 或 `xxx.ts` (工具类)
- **错误处理**: 统一使用 `Common.requireArguments()` 进行参数校验
- **代码格式化**: 使用 Prettier 统一代码风格

### 测试和验证
```bash
# 启动开发服务器 (推荐Node.js)
npm run dev  # Node.js 开发服务器 (端口4398)

# 基础API测试
curl "http://localhost:4398/v2/60s"                    # 核心API - JSON格式
curl "http://localhost:4398/v2/60s?encoding=text"      # 文本格式
curl "http://localhost:4398/v2/60s?encoding=image"     # 图片重定向

# 其他API测试示例
curl "http://localhost:4398/v2/bing"                   # 必应壁纸
curl "http://localhost:4398/v2/hitokoto"               # 一言语录
curl "http://localhost:4398/v2/weather?city=北京"      # 天气查询
curl -X POST "http://localhost:4398/v2/fanyi" \        # 翻译API
     -H "Content-Type: application/json" \
     -d '{"text":"Hello","from":"en","to":"zh"}'

# 健康检查
curl "http://localhost:4398/health"                    # 健康检查端点
curl "http://localhost:4398/"                          # API信息端点
```

---

## 📝 重要文件位置

### 核心配置文件
- `/src/config.ts` - 项目配置和常量
- `/src/common.ts` - 公共工具类和函数
- `/src/router.ts` - **最重要** - 所有路由定义

### 工具脚本
- `/scripts/write-update-time.ts` - 更新时间写入脚本 (发版前执行)
- `/scripts/parse-js-questions.ts` - JS问题解析脚本 (已废弃)

### 配置文件
- `/package.json` - Node.js/npm 配置  
- `/deno.json` - Deno 配置
- `/wrangler.toml` - Cloudflare Workers 配置
- `/Dockerfile` - Docker 构建配置

---

## 💡 项目特色和架构理念

### 🌟 "60s看世界" 核心理念
- **项目灵魂**: 60s看世界API是整个项目的核心和灵魂功能
- **权威数据源**: 数据来自官方微信公众号，每日7-8点更新
- **多格式支持**: JSON/文本/图片三种输出格式，满足不同场景需求
- **容灾机制**: GitHub/Vercel/JSDeliver 三重CDN备份，确保服务稳定

### 🛠️ 开发者体验优化
- **统一API设计**: 所有接口使用相同的响应格式和错误处理
- **智能参数获取**: `Common.getParam()` 同时支持GET query和POST body
- **多编码格式**: `?encoding=json|text|image|image-proxy` 灵活输出
- **详细错误信息**: 400错误时提供完整的参数使用说明和示例
- **开发环境优化**: 代理URL避免CORS问题，调试信息辅助开发

### ⚡ 性能和可靠性架构
- **智能缓存策略**: 内存缓存 + 多级降级机制，实现毫秒级响应
- **全球CDN加速**: Deno Deploy全球边缘节点，就近服务用户
- **多运行时兼容**: 支持Deno/Node.js/Bun/Cloudflare Workers，部署灵活
- **容错降级**: 多数据源备份，确保99.9%可用性
- **类型安全**: TypeScript严格模式，编译时发现潜在问题

### 🏗️ 模块化架构设计
- **职责分离**: 中间件层、路由层、业务层清晰分离
- **统一模式**: 所有API模块遵循相同的`ServiceXxx`类模式
- **配置集中**: 环境变量和常量统一在`config.ts`管理
- **工具复用**: `Common`类提供通用功能，避免代码重复

---

## 🔄 开发历史和版本信息

### 当前状态 (v2.21.1)
- **最后更新**: 2025/08/27 08:52:07
- **项目成熟度**: 生产稳定版本，API丰富完善
- **主要特性**: 30+个API端点，多运行时支持，全球CDN部署

### 核心架构演进
- **初期版本**: 基于Deno构建的简单API集合
- **中期发展**: 引入Oak框架，规范化API模块结构
- **当前版本**: 多运行时支持，智能缓存，容错机制完善

### 技术栈稳定性
- **主要依赖**: @oak/oak、cheerio、dayjs、tyme4ts 等核心库长期稳定
- **运行时兼容**: 全面支持 Deno/Node.js/Bun/Cloudflare Workers
- **部署方式**: Deno Deploy(主要)、Docker、传统VPS部署

### 维护状态
- **活跃维护**: 项目处于活跃维护状态，定期更新依赖和功能
- **社区支持**: GitHub开源，用户反馈群活跃
- **文档完善**: API文档、部署文档、开发指南齐全

---

## 📋 开发备忘

### 常用文件位置速查
- **路由配置**: `src/router.ts` (新增API必须在此注册)
- **公共工具**: `src/common.ts` (参数获取、响应构建、工具函数)
- **环境配置**: `src/config.ts` (端口、调试、环境变量)
- **中间件**: `src/middlewares/` (CORS、编码、错误处理等)

### 快速开发流程
1. 创建 `src/modules/new-api.module.ts` 文件
2. 实现 `ServiceNewApi` 类，遵循现有模式
3. 在 `src/router.ts` 中导入并注册路由
4. 使用 `npm run dev` 启动开发服务器测试
5. 更新项目README的API分类表格

### 调试技巧
- 开启 `DEBUG=1` 环境变量查看调试信息
- 使用 `?force-update=1` 参数强制刷新缓存
- 检查 `__debug__` 字段获取API元信息

---

*📅 文档更新时间: 2025-08-27*  
*🤖 由 Claude Code 分析生成和维护*  
*📝 文档版本: v3.0 (架构重构版)*