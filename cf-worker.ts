// 保留原项目的核心逻辑（接口部分）
import { gen60s } from "./src/60s";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // --------------------------
    // 情况1：访问根路径，返回网页
    // --------------------------
    if (url.pathname === "/" || url.pathname === "") {
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>60s 看世界</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        body {
            background: #f5f6f7;
            max-width: 600px;
            margin: 30px auto;
            padding: 20px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 16px;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        h1 {
            font-size: 22px;
            margin-bottom: 10px;
            color: #333;
        }
        p {
            line-height: 1.6;
            color: #555;
            margin-bottom: 15px;
        }
        img {
            width: 100%;
            border-radius: 12px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">加载中...</div>
    <div id="content"></div>

    <script>
        // 调用当前 Worker 自己的接口（避免跨域问题）
        fetch("/api")
        .then(res => res.json())
        .then(data => {
            document.getElementById("loading").style.display = "none";
            let html = "";
            if (data && data.entities) {
                data.entities.forEach(item => {
                    if (item.entity_content?.image) {
                        const img = item.entity_content.image.image_ori;
                        html += \`
                        <div class="card">
                            <h1>60s 看世界</h1>
                            <img src="\${img.url}" alt="每日新闻图片">
                        </div>
                        \`;
                    }
                });
            }
            document.getElementById("content").innerHTML = html;
        })
        .catch(err => {
            document.getElementById("loading").innerText = "加载失败，请稍后再试";
            console.error(err);
        });
    </script>
</body>
</html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=utf-8" }
      });
    }

    // --------------------------
    // 情况2：访问 /api，返回原来的 JSON 接口
    // --------------------------
    if (url.pathname === "/api") {
      const data = await gen60s();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // --------------------------
    // 情况3：其他路径，也返回接口数据（兼容原地址）
    // --------------------------
    const data = await gen60s();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  },
};
