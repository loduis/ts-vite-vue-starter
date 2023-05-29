import app from './main'
;(async () => {
  await app.mount('#app')
})()

if (import.meta.hot) {
  import.meta.hot.on('update-assets', () => {
    location.reload()
  })
}
