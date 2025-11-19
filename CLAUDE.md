# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

60s API is a comprehensive API collection providing news, trending topics, and utility services. Built with Deno and Oak framework, it supports multiple runtime environments (Deno, Node.js, Bun) and deployment platforms (Docker, Cloudflare Workers).

## Development Commands

### Running the application
```bash
# Development mode (port 4398)
pnpm run dev

# Production mode (port 4398)
pnpm run start

# Docker
pnpm run docker:build
pnpm run docker:run
```

### Common operations
```bash
# Update all lockfiles
pnpm run update-lockfile

# Release new version (bumps version and creates git tag)
pnpm run release
```

## Architecture

### Core Structure
- **Entry points**: `deno.ts`, `node.ts`, `bun.ts`, `cf-worker.ts` for different runtimes
- **Main app**: `src/app.ts` - Oak application with middleware setup
- **Routing**: `src/router.ts` - centralized route definitions with `/v2` prefix
- **Modules**: `src/modules/` - individual API service implementations
- **Middlewares**: `src/middlewares/` - cross-cutting concerns (CORS, error handling, encoding)

### Key Components
- **Common utilities**: `src/common.ts` - shared functions for JSON building, parameter extraction, date formatting
- **Configuration**: `src/config.ts` - environment-based settings
- **Encoding middleware**: Handles `encoding` query parameter for response format transformation

## Development Guidelines

### Module Development Pattern

Each API endpoint follows a consistent module pattern:

1. **Create service class** in `src/modules/[name].module.ts`
2. **Implement `handle()` method** returning Oak RouterMiddleware
3. **Handle different encoding formats** in the middleware (see Response Formats below)
4. **Register route** in `src/router.ts`
5. **Import and add** to router configuration

Example structure:
```typescript
export class MyModule {
  async handle(): RouterMiddleware<any> {
    return async (ctx) => {
      const encoding = ctx.state.encoding
      const data = await this.fetchData()

      if (encoding === 'text') {
        ctx.response.body = this.formatAsText(data)
      } else if (encoding === 'markdown') {
        ctx.response.body = this.formatAsMarkdown(data)
      } else {
        ctx.response.body = Common.buildJson(data)
      }
    }
  }
}
```

### Response Format Standards

**IMPORTANT**: Unless specifically noted otherwise, ALL APIs MUST support these three encoding formats:

- `json` (default) - structured JSON response via `Common.buildJson()`
- `text` - plain text format for terminal/script usage
- `markdown` - markdown formatted text for documentation/display

Special formats (only when explicitly needed):
- `image` - redirect to image URL
- `image-proxy` - proxied image content
- `html` - HTML encoded output

### Time Handling Standards

**ALWAYS use `dayjs` for time operations:**

```typescript
import { dayjs, TZ_SHANGHAI } from './common.ts'

// Get current time in Shanghai timezone
const now = dayjs().tz(TZ_SHANGHAI)

// Format date
const dateStr = now.format('YYYY-MM-DD')

// Parse and convert timezone
const parsedDate = dayjs(timestamp).tz(TZ_SHANGHAI)
```

**Default timezone**: Always use `TZ_SHANGHAI` (`Asia/Shanghai`) for all time operations unless explicitly specified otherwise.

### Common Patterns

**Response Building:**
```typescript
// Success response
ctx.response.body = Common.buildJson(data)

// Error response with custom message
ctx.response.status = 400
ctx.response.body = Common.buildJson(null, 400, 'Custom error message')

// Require arguments
if (!param) {
  Common.requireArguments('paramName', ctx.response)
  return
}
```

**Parameter Handling:**
```typescript
// Query parameters
const param = ctx.request.url.searchParams.get('param')

// Support both query and POST body (for large params)
const largeParam = await Common.getParam('param', ctx.request, true)
```

**Web Scraping:**
```typescript
// Always use Common.chromeUA for User-Agent
const response = await fetch(url, {
  headers: { 'User-Agent': Common.chromeUA }
})
```

**Caching:**
```typescript
// Implement caching for expensive operations
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// Check cache before fetching
const cached = cache.get(key)
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data
}
```

### Code Quality Standards

- **Type Safety**: Use TypeScript types, avoid `any` when possible
- **Error Handling**: Always handle fetch errors and invalid responses
- **Validation**: Validate required parameters using `Common.requireArguments()`
- **Consistency**: Follow existing code patterns in `src/modules/`
- **Documentation**: Add JSDoc comments for complex functions
- **Testing**: Test all three encoding formats (json/text/markdown) when adding new APIs

### Useful Utilities

From `src/common.ts`:
- `Common.buildJson()` - Standard JSON response builder
- `Common.requireArguments()` - Parameter validation
- `dayjs` / `TZ_SHANGHAI` - Time operations (prefer over `Common.localeDate()`/`Common.localeTime()`)
- `Common.randomInt()` / `Common.randomItem()` - Random utilities
- `Common.md5()` - MD5 hashing
- `Common.qs()` - Query string builder
- `Common.tryRepoUrl()` - GitHub CDN fallback fetcher

**Note**: `Common.localeDate()` and `Common.localeTime()` are legacy utilities. For new code, always use `dayjs` with `TZ_SHANGHAI` timezone as shown in the Time Handling Standards section.
