fetch('https://moralis.com/api/insights/get-coins', {
  method: 'POST',
  body: JSON.stringify({
    filter: {
      chainId: '0x2105',
      filters: [
        { filterName: 'marketCap', gt: 100000 },
        { filterName: 'moralisScore', gt: 65 },
      ],
      sorting: {
        filterName: 'volumeChangeUSD',
        orderBy: 'DESC',
        limit: 250,
        timeFrame: { unit: 'Day', amount: 1 },
      },
    },
  }),
  headers: { 'Content-Type': 'application/json' },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => console.error('Request Failed:', err))
