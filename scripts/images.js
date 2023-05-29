// https://www.gatsbyjs.com/docs/preoptimizing-images/
import imagemin from 'imagemin'
import imageminWebp from 'imagemin-webp'
import sharp from 'sharp'
import glob from 'glob'
import fs from 'fs-extra'

const MAX_WIDTH = 1024
const QUALITY = 98
const sizes = [640, 768, 1024, 1280]
const isProd = process.env.NODE_ENV === 'production'

async function toWebp(filename) {
  await imagemin([filename], {
    destination: 'src/assets/images/',
    plugins: [imageminWebp({ quality: QUALITY })]
  })
}

async function clean() {
  const matches = glob.sync('/src/assets/images/**/*.{webp,}')
  for (const filename of matches) {
    await fs.remove(filename)
  }
  console.log('Clean: webp')
}
;(async () => {
  if (isProd) {
    console.log('Clean ...')
    await clean()
  }
  const now = new Date()
  now.setDate(now.getDate() - 1)
  for (const filename of glob.sync(`/src/assets/images/**/*.{png,jpg,jpeg}`)) {
    if (!isProd) {
      const stats = fs.statSync(filename)
      const date = new Date(stats.mtime)
      if (now.getTime() > date.getTime()) {
        continue
      }
    }
    if (filename.includes('-hero.') || filename.includes('-hero-')) {
      const stream = sharp(filename)
      const info = await stream.metadata()
      if (info.width >= MAX_WIDTH) {
        for (const size of sizes) {
          if (
            info.width === MAX_WIDTH ||
            filename.endsWith(`-${size}.png`) ||
            filename.endsWith(`-${size}.jpg`)
          ) {
            continue
          }
          const optimizedName = filename.replace(
            /(\..+)$/,
            (match, ext) => `-${size}px${ext}`
          )
          await stream.resize(size).png().toFile(optimizedName)
          await toWebp(optimizedName)
          await fs.remove(optimizedName)
          console.log('Webp: ' + optimizedName)
        }
      }
    }
    await toWebp(filename)
    console.log('Webp: ' + filename)
  }
})()
