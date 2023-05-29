/* global dataLayer */
;((global, doc, lang, tag) => {
  global.gtag = function (eventName) {
    if (typeof global.dataLayer !== 'undefined') {
      if (eventName === 'start') {
        global.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        })
      } else if (eventName !== 'event') {
        if (eventName === 'history') {
          history()
        }
        eventName = 'event.' + eventName
        global.dataLayer.push({ event: eventName })
      }
    }
  }
  // config event for any history
  function history() {}

  function createScript(src, options = {}) {
    const tag = 'script'
    const s1 = doc.createElement(tag)
    const s0 = doc.getElementsByTagName(tag)[0]
    s1.async = true
    s1.src = src
    s0.parentNode.insertBefore(s1, s0)
    return s1
  }

  function getUrlParam(param) {
    const match = location.search.match(param + '=([^&#]*)')
    return match && match.length === 2
      ? strip(decodeURIComponent(match[1]))
      : ''
  }

  function strip(string) {
    return string.replace(/\+/g, ' ').trim().replace(/\s+\s/g, ' ')
  }

  if (sessionStorage !== null) {
    if (location.search !== null) {
      const isAds = getUrlParam('gclid') || getUrlParam('fbclid')
      if (isAds && sessionStorage.getItem('_ga') === null) {
        const campaign = getUrlParam('utm_campaign')
        const group = getUrlParam('utm_content')
        const keyword = getUrlParam('utm_term') || getUrlParam('utm_keyword')
        const source = getUrlParam('utm_source').toLowerCase()
        const params = {
          campaign: campaign + ': ' + group,
          keyword: source + ': ' + keyword
        }
        sessionStorage.setItem('_ga', JSON.stringify(params))
      }
    }
  }
  // TagManager
  if (tag) {
    ;((l, i) => {
      global[l] = global[l] || []
      global[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
      createScript('https://www.googletagmanager.com/gtm.js?id=' + i)
    })('dataLayer', tag)
  }
})(
  window,
  document,
  document.querySelector('html').getAttribute('lang') || 'en',
  VITE_GTM
)
