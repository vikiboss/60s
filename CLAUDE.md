# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

60s API is a comprehensive API collection providing news, trending topics, and utility services. Built with Deno and Oak framework, it supports multiple runtime environments (Deno, Node.js, Bun) and deployment platforms (Docker, Cloudflare Workers).

## Development Commands

### Running the application
```bash
# Development mode (port 4398)
npm run dev

# Production mode (port 4398) 
npm run start

# Docker
npm run docker:build
npm run docker:run
```

### Common operations
```bash
# Update all lockfiles
npm run update-lockfile

# Release new version (bumps version and creates git tag)
npm run release
```

## Architecture

### Core Structure
- **Entry points**: `deno.ts`, `node.ts`, `bun.ts`, `cf-worker.ts` for different runtimes
- **Main app**: `src/app.ts` - Oak application with middleware setup
- **Routing**: `src/router.ts` - centralized route definitions with `/v2` prefix
- **Modules**: `src/modules/` - individual API service implementations
- **Middlewares**: `src/middlewares/` - cross-cutting concerns (CORS, error handling, encoding)

### Module Pattern
Each API endpoint follows a consistent module pattern:
- Service class with `handle()` method returning Oak RouterMiddleware
- Support for multiple output formats via `ctx.state.encoding` (json, text, image, etc.)
- Common utilities through `Common` class from `src/common.ts`

### Key Components
- **Common utilities**: `src/common.ts` - shared functions for JSON building, parameter extraction, date formatting
- **Configuration**: `src/config.ts` - environment-based settings
- **Encoding middleware**: Handles `encoding` query parameter for response format transformation

### Response Formats
APIs support multiple output formats via `encoding` parameter:
- `json` (default) - structured JSON response
- `text` - plain text format
- `image` - redirect to image URL
- `image-proxy` - proxied image content
- `html` - HTML encoded output (some APIs)

### Module Development
When adding new modules:
1. Create service class in `src/modules/[name].module.ts`
2. Implement `handle()` method returning RouterMiddleware
3. Handle different encoding formats in the middleware
4. Register route in `src/router.ts`
5. Import and add to router configuration

### Common Patterns
- Use `Common.buildJson()` for consistent JSON responses
- Handle query parameters with `ctx.request.url.searchParams`
- Support POST body parameters via `Common.getParam()`
- Use `Common.chromeUA` for web scraping requests
- Implement caching where appropriate using Map or similar

## Weather Module Architecture

The weather module (`src/modules/weather.module.ts`) provides comprehensive weather information using QQ Weather APIs:

### Key Features
- **Dynamic City Search**: Uses `https://i.news.qq.com/city/like` API for intelligent city name matching
- **Dual API Architecture**: Separate calls to weather and air quality endpoints for comprehensive data
- **Error Handling**: Returns 404 for unknown cities, 500 for API failures
- **Caching**: City information cached in memory for performance
- **Rich Data**: Includes weather conditions, air quality, life indices, alerts, and forecasts

### Endpoints
- `/v2/weather` - Current weather conditions, air quality, life indices, and alerts
- `/v2/weather/forecast` - Hourly (48h) and daily (up to 8 days) forecasts with sunrise/sunset data

### Usage Examples
```bash
# Current weather for a city
curl "https://60s.viki.moe/v2/weather?query=深圳"

# 5-day weather forecast
curl "https://60s.viki.moe/v2/weather/forecast?query=北京&days=5"
```

### Parameters
- `location`: City name in Chinese (e.g., 南京, 北京, 深圳, 三亚)
- `days`: Number of forecast days (forecast endpoint only, max 8 days, default 7)

### Data Sources
- Weather data: `https://i.news.qq.com/weather/common`
- City search: `https://i.news.qq.com/city/like`
- Air quality: Integrated within weather API response
