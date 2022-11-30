import { serve } from "https://deno.land/std@0.155.0/http/server.ts";

const responseWithBaseRes = (
    obj: Record<number | string | symbol, any>
        | string | number | boolean | null | undefined,
    status = 200,
    message = 'OK'
) => {
    let res = ''

    try {
        res = JSON.stringify({ status, message, data: obj ?? {} })
    } catch {
        res = JSON.stringify({ status: 500, message: 'Oops', data: {} })
    }

    return new Response(res, {
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

function Utf82Ascii(str: string) {
    return str.split("").map(e => `#&${e.charCodeAt(0)};`).join("")
}

function Ascii2Utf8(str: string) {
    return str.replace(/&#(\d+);/g, (_, $1) => String.fromCharCode(Number($1)))
}

const api = "https://www.zhihu.com/api/v4/columns/c_1261258401923026944/items?limit=1";
const oneHourMs = 60 * 60 * 1000
const cache: Record<number, string[]> = {}

async function handler(req: Request) {
    const url = new URL(req.url)
    const isText = url.searchParams.get('encoding') === 'text'

    const today = Math.floor((Date.now() + 8 * oneHourMs) / (24 * oneHourMs))

    if (!cache[today]) {
        const { data } = await (await fetch(api)).json()
        const contents = data[0].content.match(/<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g)
        cache[today] = contents.map((e: string) => Ascii2Utf8(e.replace(/<[^<>]+>/g, '')))
        cache[today].splice(1, 1)
    }

    if (isText) {
        return new Response(cache[today].join("\n"))
    } else {
        return responseWithBaseRes(cache[today])
    }
}

serve(handler);
