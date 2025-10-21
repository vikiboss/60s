# API测试指南

## 🎯 为什么要测试

行业追踪模块使用的是第三方API，这些API可能会：
- 变更端点或参数
- 限制访问频率
- 暂时不可用
- 返回数据格式变化

**因此，部署后必须先测试验证！**

## 🧪 快速测试

### 1. 启动服务

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

服务会在 `http://localhost:4398` 启动。

### 2. 运行测试脚本

在另一个终端窗口运行：

```bash
node --no-warnings --experimental-transform-types scripts/test-industry-apis.ts
```

### 3. 查看测试结果

测试脚本会输出类似这样的结果：

```
============================================================
🚀 行业追踪API测试
============================================================
Base URL: http://localhost:4398

🧪 测试: 掘金热门文章
   URL: http://localhost:4398/v2/industry/juejin
   ✅ 成功: 获取 20 条数据
   📄 示例: 深入理解 React 18 新特性...

🧪 测试: GitHub Trending
   URL: http://localhost:4398/v2/industry/github-trending
   ✅ 成功: 获取 25 条数据
   📄 示例: username/awesome-project...

🧪 测试: V2EX热帖
   URL: http://localhost:4398/v2/industry/v2ex
   ✅ 成功: 获取 30 条数据
   📄 示例: 程序员们都在讨论什么...

============================================================
📊 测试总结
============================================================
✅ 成功: 5 / 5
❌ 失败: 0 / 5
```

## 🔍 手动测试单个API

你也可以用curl手动测试每个接口：

```bash
# 测试掘金
curl http://localhost:4398/v2/industry/juejin | jq '.data[0].title'

# 测试GitHub Trending
curl http://localhost:4398/v2/industry/github-trending | jq '.data[0].repo'

# 测试AI资讯
curl http://localhost:4398/v2/industry/ai-news | jq '.data[0].title'

# 测试V2EX
curl http://localhost:4398/v2/industry/v2ex | jq '.data[0].title'
```

## 🐛 调试失败的API

如果某个API测试失败：

### 1. 查看控制台日志

服务器控制台会输出详细的调试信息：

```
[Juejin] 请求掘金热门文章
[Juejin] 返回状态: 0, 数据条数: 20
[Juejin] ✓ 成功缓存 20 条数据
```

或者错误信息：

```
[Juejin] 请求失败: Error: HTTP 403
[Juejin] 使用缓存数据
```

### 2. 常见问题

**403 Forbidden**
- 原因：API需要特殊header或被限流
- 解决：检查User-Agent，降低请求频率

**返回空数据**
- 原因：API端点或参数变更
- 解决：查看控制台日志，检查返回的原始数据结构

**网络超时**
- 原因：第三方服务不可用
- 解决：等待后重试，或使用备用API

### 3. 如果API持续不可用

如果某个API一直失败：

1. 查看文档中的API端点说明
2. 尝试直接在浏览器访问API
3. 搜索该API的最新使用文档
4. 考虑禁用该模块或寻找替代数据源

## 📝 修改测试脚本

你可以修改 `scripts/test-industry-apis.ts` 来：

- 添加新的测试用例
- 修改测试参数
- 自定义输出格式

示例：

```typescript
const tests = [
  {
    name: 'GitHub Trending (Go语言)',
    endpoint: '/v2/industry/github-trending?lang=go&since=weekly',
  },
  // 添加更多测试...
]
```

## ✅ 测试通过后

当所有API测试通过后，你可以：

1. 在生产环境部署
2. 设置监控和告警
3. 定期运行测试脚本确保API仍然可用
4. 考虑添加健康检查端点

## 🔗 相关文档

- [行业追踪API文档](./INDUSTRY_TRACKER.md)
- [项目README](../readme.md)
