// Pre-render the app into static HTML.
// run `yarn generate` and then `dist/static` can be served as a static site.

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import YAML from 'js-yaml'
import validator from 'html-validator'
import { minify } from 'html-minifier-terser'
import { render, routes, slugify } from '../dist/server/server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (filename) => path.resolve(__dirname, filename)
const readFileSync = (filename, parse = false) => {
  const content = fs.readFileSync(resolve(filename), { encoding: 'utf-8' })
  if (parse) {
    return JSON.parse(content)
  }
  return content
}
const template = readFileSync('../dist/index.html')
const manifest = readFileSync('../dist/ssr-manifest.json', true)

;(async () => {
  const exclude = ['/:pathMatch(.*)*']
  for (const route of routes) {
    if (exclude.includes(route.path)) {
      continue
    }
    for (const p of scanPaths(route)) {
      let html = await render(p, template)
      await validate(html)
      html = await minifyHTML(html)
      html = replaceAssets(html)
      save(p, html)
    }
  }
  clean()
})()

function save(p, html) {
  let filePath = `../dist${p === '/' ? '/index' : p}.html`
  try {
    filePath = resolve(filePath)
    fs.writeFileSync(filePath, html)
  } catch (e) {
    const dirname = path.dirname(filePath)
    fs.mkdirSync(dirname)
    fs.writeFileSync(filePath, html)
  }
  console.log('Build: ' + p)
}

function replaceAssets(html) {
  if (html.includes('=/src/assets/images/')) {
    const images = html.match(/=\/src\/assets\/images\/([^ ]+)/g)
    for (let image of images) {
      image = image.substr(1)
      let _path = image.replace('/src', '').replace('/images', '')
      const ext = path.extname(_path)
      let real = findImage(_path.replace(ext, ''), ext)
      if (real) {
        html = html.replace(image, real)
      }
    }
  }
  return html
}

function findImage(path, ext) {
  for (const key in manifest) {
    for (const asset of manifest[key]) {
      if (asset.startsWith(path) && asset.endsWith(ext)) {
        return asset
      }
    }
  }
}

function clean() {
  fs.unlinkSync(resolve('../dist/ssr-manifest.json'))
  fs.unlinkSync(resolve('../dist/ssr-manifest.json.gz'))
}

async function minifyHTML(html) {
  return minify(html, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeComments: false,
    removeRedundantAttributes: true,
    html5: true,
    minifyURLs: true,
    removeEmptyAttributes: true,
    minifyJS: false
  })
}

async function validate(html) {
  try {
    const result = await validator({
      validator: 'WHATWG',
      data: html
    })
    if (!result.isValid) {
      console.log(result)
      throw 'Invalid htmll'
    }
  } catch (error) {
    console.log(error)
    throw html
  }
}

function scanPaths(route) {
  const paths = []
  const { lang, master } = route.meta
  if (route.path.includes(':')) {
    const id = 'src/content/' + lang + '/' + master + '.yml'
    const data = loadYaml(id)
    for (const entry of data) {
      const s = slugify(entry.slug || entry.title)
      paths.push(route.path.replace(':slug', s))
    }
  } else {
    paths.push(route.path)
  }
  return paths
}

function loadYaml(filename) {
  return YAML.load(readFileSync(filename))
}
