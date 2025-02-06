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
    cookie:
      'SESSIONID=N9867psGL8lVfpp9u8VldvtEXQGyviNfLNL64gQBG76; SESSIONID=xQEGd39LNxgH1culz56fDzVzbEbB2xXe59EJdXrx0q7; _xsrf=37SBHIVaV1of6XDICO0bSCB3mWWa4M1m; _zap=217bb0a1-9ff2-43b6-a827-4d928a8c4405; d_c0=ACBSOkp7zRiPTkph8h5vOMaZoWDoxOBpOCc=|1718886497; __snaker__id=w1Zujd3sWUUxcCWl; q_c1=c6369ee5593b4e97ac9cae132f648530|1723030753000|1723030753000; z_c0=2|1:0|10:1738723912|4:z_c0|80:MS4xWW9zMVZRQUFBQUFtQUFBQVlBSlZUVWNna0dpaEdWeVk0VTNqNnZBd18yS01NU0ZkSzVVYVpBPT0=|a47fa2ce39370655be92f521c3dd20a8527df217fdc710c08967b79ecb14c46d; tst=h; SESSIONID=BSXen2sVYtRINnSuCMtdCPPWGho6QM8mpSRMU5DdaO6; __zse_ck=004_4JOckzGYXLTAFG1aCCL2z1AOetxz=6EA5gF/E83l5kXnm1O=LZahm1MoBl8E1oLceBWyDLPZp8tHBDtpHersByitNyjwCEdnU5pMPT0/dYJLSrLfeGwqOM7zCKDGsQC8-wdK7pXvT+BldQBjbS+KR9fF0lTNAIl4BaQpqYUW1//J+jcKVD4GXJ00CAxVnG625opoL44lAymXrnhXyfhK8HzQFuZ3Ui3yPxAj2QYlrLEIPYxgpBjlujh5+eEmcY1Vf; BEC=6ff32b60f55255af78892ba1e551063a',
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
