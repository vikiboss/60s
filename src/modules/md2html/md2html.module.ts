import fs from 'node:fs'
import path from 'node:path'
import rehypeShiki from '@shikijs/rehype'
import { remarkAlert } from 'remark-github-blockquote-alert'
import { unified } from 'unified'
import rehypeKatex from 'rehype-katex'
// import rehypePresetMinify from 'rehype-preset-minify'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkHeadingId from 'remark-heading-id'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { Common } from '../../common.ts'
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerMetaHighlight,
  transformerNotationHighlight,
  transformerMetaWordHighlight,
  transformerCompactLineOptions,
  transformerNotationErrorLevel,
  transformerNotationWordHighlight,
} from '@shikijs/transformers'

import type { RouterMiddleware } from '@oak/oak'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const opts = { encoding: 'utf-8' } as const

const glmCSS = fs.readFileSync(path.join(__dirname, './css/glm.css'), opts).replace(/[\r\n]+/g, ' ')
const katexCSS = fs.readFileSync(path.join(__dirname, './css/katex.css'), opts).replace(/[\r\n]+/g, ' ')
const ghAlertCSS = fs.readFileSync(path.join(__dirname, './css/gh-alert.css'), opts).replace(/[\r\n]+/g, ' ')
const shikiCSS = fs.readFileSync(path.join(__dirname, './css/shiki.css'), opts).replace(/[\r\n]+/g, ' ')
const globalCSS = fs.readFileSync(path.join(__dirname, './css/global.css'), opts).replace(/[\r\n]+/g, ' ')

class ServiceMD2HTML {
  handle(): RouterMiddleware<'/md2html'> {
    return async (ctx) => {
      const markdown = await ctx.request.body.text()
      const title = ctx.request.url.searchParams.get('title') || ''

      if (!markdown) {
        ctx.response.status = 400
        ctx.response.body = Common.buildJson(null, 400, '需要传入 markdown 文本内容作为 POST 请求的 body')
        return
      }

      const html = await this.md2html(markdown, { htmlTitle: title })
      ctx.response.headers.set('Content-Type', 'text/html')
      ctx.response.body = html
    }
  }

  async md2html(md: string, options: { htmlTitle?: string }): Promise<string> {
    const { htmlTitle = '' } = options

    const enableShiki = md.includes('```')
    const enableKatex = md.includes('$$') || md.includes('\\(') || md.includes('\\[')
    const enableGhAlert = md.includes('> [!')
    const title = htmlTitle || (md.match(/#+\s*(.+)\n?/)?.[1] || 'Readme').replace(/\s*\{#.+\}\s*/g, '').trim()

    const processor = this.getProcessor({
      shiki: enableShiki,
      katex: enableKatex,
      ghAlert: enableGhAlert,
    })

    const mainHTML = await processor.process(md)

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 2rem auto; background-color: var(--color-canvas-default); }
      main { max-width: 800px; margin: 0 auto; }
      ${globalCSS}
      ${glmCSS}
      ${enableKatex ? katexCSS : ''}
      ${enableGhAlert ? ghAlertCSS : ''}
      ${enableShiki ? shikiCSS : ''}
    </style>
  </head>
  <body class="markdown-body">
    <main data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
      ${mainHTML.toString()}
    </main>
  </body>
</html>`
  }

  getProcessor(options: { shiki?: boolean; katex?: boolean; ghAlert?: boolean }) {
    const { shiki = false, katex = true, ghAlert = true } = options

    let processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkEmoji, {
        accessible: true,
        padSpaceAfter: true,
        emoticon: true,
      })
      .use(remarkHeadingId, {
        defaults: true,
        uniqueDefaults: true,
      })

    if (ghAlert) {
      processor = processor.use(remarkAlert, {
        legacyTitle: true,
      })
    }

    if (katex) {
      processor = processor.use(remarkMath)
    }

    processor = processor.use(remarkGfm).use(remarkRehype, {
      allowDangerousHtml: true,
    })

    if (shiki) {
      processor = processor.use(rehypeShiki, {
        defaultColor: 'light',
        themes: {
          dark: 'one-dark-pro',
          light: 'one-light',
        },
        transformers: [
          transformerNotationDiff(), // like: +const a = 1
          transformerNotationFocus(), // like: // [!code focus]
          transformerMetaHighlight(), // like: ```js {1,3-5}
          transformerMetaWordHighlight(), // like: ```js /Hello/
          transformerNotationHighlight(), // like: // [!code highlight]
          transformerCompactLineOptions(), // shiki lineOptions
          transformerNotationErrorLevel(), // like: [!code error] & [!code warning]
          transformerNotationWordHighlight(), // like: // [!code word:Hello]
        ],
      })
    }

    if (katex) {
      processor = processor.use(rehypeKatex)
    }

    processor = processor.use(rehypeRaw, {
      tagfilter: true,
    })
    // .use(rehypePresetMinify)

    return processor.use(rehypeStringify)
  }
}

export const serviceMD2HTML = new ServiceMD2HTML()
