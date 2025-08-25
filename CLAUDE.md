# 📚 60s API 项目上下文文档

> Claude Code 会话恢复用文档 - 包含项目结构、开发规范、技术约定等关键信息

## 🎯 项目概述

### 核心定位
- **项目名称**: 60s API - 高质量开放 API 集合
- **核心功能**: "每天60秒读懂世界" 新闻API，同时提供29个不同类型的API服务
- **技术理念**: 权威数据源 + 毫秒级响应 + 开发者友好
- **主要特色**: 全球CDN加速、多运行时支持、统一API设计

### 项目规模
- **当前版本**: v2.18.2
- **API数量**: 29个端点
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
  "@oak/oak": "^17.1.4",        // Web 框架
  "cheerio": "^1.1.2",          // HTML 解析 (类 jQuery)
  "dayjs": "^1.11.13",          // 日期处理
  "tyme4ts": "^1.3.4"           // 农历日期转换
}
```

### 项目结构
```
60s/
├── src/
│   ├── app.ts                 // 应用主入口
│   ├── router.ts              // 路由配置 (核心文件)
│   ├── common.ts              // 公共工具类
│   ├── config.ts              // 配置管理
│   ├── middlewares/           // 中间件
│   │   ├── cors.ts           // CORS 处理
│   │   ├── encoding.ts       // 编码处理
│   │   └── ...
│   └── modules/              // API 模块
│       ├── 60s.module.ts     // 核心"看世界"模块
│       ├── js-questions/     // JS问题模块 (新增)
│       ├── answer/           // 答案之书
│       ├── duanzi/           // 段子模块
│       └── ...
├── scripts/                  // 工具脚本
├── deno.ts                   // Deno 启动文件
├── node.ts                   // Node.js 启动文件  
├── cf-worker.ts              // Cloudflare Worker 入口
└── package.json              // 项目配置
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
// 成功响应格式
{
  "code": 200,
  "message": "获取成功。数据来自官方/权威源头，以确保稳定与实时。开源地址 https://github.com/vikiboss/60s，反馈群 595941841",
  "data": { /* 实际数据 */ }
}

// 支持的编码格式
?encoding=json    // JSON格式 (默认)
?encoding=text    // 纯文本格式
?encoding=image   // 图片重定向 (特定API)
```

### 公共工具使用
```typescript
// 参数获取 (支持 GET query 和 POST body)
const param = await Common.getParam('paramName', request)

// 响应构建
ctx.response.body = Common.buildJson(data, code?, message?)

// 随机选择
const randomItem = Common.randomItem(array)

// 日期格式化
const dateStr = Common.localeTime(timestamp)
```

---

## 📊 API 分类体系

### 1. 信息资讯类 (5个)
- `GET /v2/60s` - **核心API**: 每天60秒读懂世界
- `GET /v2/bing` - 必应每日壁纸
- `GET /v2/today_in_history` - 历史上的今天
- `GET /v2/ai-news` - AI快讯
- `GET /v2/exchange_rate` - 汇率查询

### 2. 热门榜单类 (6个)  
- `GET /v2/bili` - 哔哩哔哩热搜
- `GET /v2/weibo` - 微博热搜
- `GET /v2/zhihu` - 知乎热榜
- `GET /v2/douyin` - 抖音热搜
- `GET /v2/toutiao` - 头条热搜
- `GET /v2/maoyan` - 猫眼票房

### 3. 实用工具类 (8个)
- `ALL /v2/fanyi` + `/v2/fanyi/langs` - 多语言翻译
- `GET /v2/weather` + `/v2/weather/forecast` - 天气查询
- `GET /v2/ip` - IP查询
- `GET /v2/lunar` - 农历转换
- `GET /v2/baike` - 百科查询
- `GET /v2/epic` - Epic免费游戏
- `ALL /v2/og` - OG信息提取
- `ALL /v2/hash` - 哈希编码工具

### 4. 学习编程类 (2个) **[新增]**
- `GET /v2/js-questions` - JavaScript面试题库 (149+题目)
- `GET /v2/js-questions/stats` - 题库统计信息

### 5. 趣味娱乐类 (8个)
- `GET /v2/kfc` - KFC段子
- `GET /v2/hitokoto` - 一言语录  
- `GET /v2/luck` - 今日运势
- `GET /v2/chemical` - 化学元素
- `GET /v2/changya` - 唱歌音频
- `GET /v2/duanzi` - 搞笑段子
- `GET /v2/fabing` - 发病文学
- `GET /v2/answer` - 答案之书

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
# 开发环境
npm run dev        # Node.js 开发
deno run -A deno.ts # Deno 开发

# 生产环境  
npm start          # Node.js 生产
deno run -A deno.ts # Deno 生产

# Docker 部署
docker run -d --name 60s -p 4399:4399 vikiboss/60s:latest
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
- **TypeScript 严格模式**: 启用所有严格检查
- **ES模块**: 使用 `import/export`，支持 `with { type: 'json' }`
- **无注释策略**: 代码自文档化，仅在必要时添加注释
- **函数式**: 优先使用纯函数和不可变数据

### 测试和验证
```bash
# 启动开发服务器
deno run --allow-net --allow-read --allow-env deno.ts

# 测试API调用
curl "http://localhost:4399/v2/js-questions?random=true"
curl "http://localhost:4399/v2/60s?encoding=text"
```

---

## 📝 重要文件位置

### 核心配置文件
- `/src/config.ts` - 项目配置和常量
- `/src/common.ts` - 公共工具类和函数
- `/src/router.ts` - **最重要** - 所有路由定义

### 数据和脚本
- `/scripts/parse-js-questions.ts` - JS问题解析脚本
- `/scripts/write-update-time.ts` - 更新时间写入脚本
- `/src/modules/js-questions/js-questions.json` - JS题库数据

### 配置文件
- `/package.json` - Node.js/npm 配置  
- `/deno.json` - Deno 配置
- `/wrangler.toml` - Cloudflare Workers 配置
- `/Dockerfile` - Docker 构建配置

---

## 💡 项目特色和最佳实践

### "看世界"核心理念
- **60s看世界API** 是项目的核心和灵魂功能
- 数据来自权威微信公众号，每日7-8点更新
- 提供JSON、文本、图片多种格式支持
- 专门的README章节突出展示

### 开发者体验优化
- **统一的API设计**: 所有接口使用相同的响应格式
- **多格式支持**: `?encoding=json|text|image` 参数
- **智能参数获取**: 同时支持GET和POST参数
- **详细的错误信息**: 400错误时提供参数使用说明

### 性能和可靠性
- **毫秒级响应**: 智能缓存策略
- **全球CDN**: Deno Deploy提供全球加速
- **多运行时支持**: Deno/Node.js/Bun/CF Workers
- **容灾备份**: 多数据源备份策略

---

## 🔄 最近更新记录

### 最新功能 (本次会话)
- ✅ **新增 JavaScript 趣味问题API** (`/v2/js-questions`)
  - 解析 GitHub 上 149+ 个 JavaScript 面试题
  - 支持随机获取、指定ID、分页查询
  - 包含题目统计API (`/v2/js-questions/stats`)
  
- ✅ **优化 README 文档结构**
  - 突出"看世界"核心功能单独展示
  - 重新组织API分类和表格展示
  - 添加实用的参数说明和示例代码

### 待办和改进方向
- [ ] 考虑添加API访问频率限制
- [ ] 优化错误处理和日志记录
- [ ] 添加更多编程学习相关的API
- [ ] 考虑添加API使用统计功能

---

*📅 文档更新时间: 2025-08-25*
*🤖 由 Claude Code 自动生成和维护*