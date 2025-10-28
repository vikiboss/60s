fetch('https://cdn.jsdmirror.com/gh/vikiboss/60s-static-host@main/static/images/2025-10-28.png', { method: 'HEAD' })
  .then((res) => res.ok)
  .then((status) => {
    if (status) {
      console.log('Image found')
    } else {
      console.log('Image not found')
    }
  })
  .catch((err) => {
    console.error(err)
  })
