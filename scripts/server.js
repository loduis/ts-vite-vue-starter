// @ts-check

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const resolve = (filename) => path.resolve(__dirname, filename)
const readFileSync = (filename, parse = false) => {
  const content = fs.readFileSync(resolve(filename), { encoding: 'utf-8' })
  if (parse) {
    return JSON.parse(content)
  }
  return content
}
const manifest = isProd
  ? // @ts-ignore
    readFileSync('../dist/client/ssr-manifest.json', true)
  : {}

async function createServer(port) {
  const app = express()

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })
  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl
    try {
      // 1. Read index.html
      let template = readFileSync('../index.html')

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template)

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { render } = await vite.ssrLoadModule('/src/server.js')

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const html = await render(url, template)

      // 5. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      console.log(e)
      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })
  console.log('http://localhost:' + port)
  app.listen(port)
}

createServer(3000)
