fetch('https://www.zhihu.com/people/98-18-69-57/posts', {
  headers: {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    priority: 'u=0, i',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    cookie: '',
    Referer: 'https://www.zhihu.com/people/98-18-69-57',
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  },
})
  .then((response) => response.text())
  .then((data) => {
    const json = JSON.parse(/<script id="js-initialData" type="text\/json">(.+?)<\/script>/.exec(data)?.[1] || '{}')
    const articles = Object.values(json?.initialState?.entities?.articles || {}) as any
    console.log(articles.length)
    for (const article of articles) {
      console.log(article.excerpt)
    }
  })
  .catch((err) => console.error('Request Failed:', err))
