import main from './main'
import { slugify } from './helpers'
import { renderToString } from '@vue/server-renderer'
import { renderSSRHead } from '@unhead/ssr'
import { useHead } from 'unhead'
import { minify } from 'terser'
import inlineScript from '/src/assets/js/inline.js?raw'

let code
const noscript = []

let text = ''
let fb = import.meta.env.VITE_FB
let gm = import.meta.env.VITE_GM || ''

if (fb) {
  text += `<img height="1" width="1" alt="noscript" style="display:none"
    src="https://www.facebook.com/tr?id=${fb}&ev=PageView&noscript=1"/>`
}
if (gm) {
  text += `<iframe src="https://www.googletagmanager.com/ns.html?id=${gm}"
    height="0" width="0"
    style="display:none;visibility:hidden" title="Google Tag Manager"
    ></iframe>`
}

if (text) {
  noscript.push({
    children: text,
    body: true
  })
}

export { slugify }

export const routes = main.routes

export async function render(url, template) {
  if (!code) {
    let source = inlineScript.replace('VITE_GTM', `'${gm}'`)
    code = import.meta.env.PROD ? (await minify(source)).code : source
  }
  const { app, head } = await main.dispatch(url)
  useHead({
    meta: [
      { charset: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      }
    ],
    link: [
      {
        rel: 'shortcut icon',
        href: '/favicon.ico'
      },
      {
        href: 'https://fonts.googleapis.com',
        rel: 'preconnect'
      },
      {
        href: 'https://fonts.gstatic.com',
        rel: 'preconnect',
        crossorigin: 'anonymous'
      },
      {
        href:
          'https://fonts.googleapis.com/css2?' +
          import.meta.env.VITE_GF +
          '&display=swap',
        rel: 'stylesheet'
      }
    ],
    script: [
      {
        children: code
      }
    ],
    noscript
  })
  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  let html = await renderToString(app)
  let {
    headTags = '',
    htmlAttrs = '',
    bodyAttrs = '',
    bodyTags = ''
  } = await renderSSRHead(head)
  // the SSR manifest generated by Vite contains module -> chunk/asset mapping
  // which we can then use to determine what files need to be preloaded for this
  // request.
  html = template.replace(
    `<body id="app">`,
    `<body id="app" ${bodyAttrs}>${html}`
  )
  html = html.replace('<html', `<html ${htmlAttrs}`)
  html = html.replace('</head>', `${headTags}</head>`)
  html = html.replace('</body>', `${bodyTags}</body>`)
  return html
}
