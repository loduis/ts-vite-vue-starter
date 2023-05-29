export default function afterBuild() {
  return {
    name: 'custom:after-build', // required, will show up in warnings and errors
    async transform(code, id) {
      if (id.endsWith('.md') || id.endsWith('.yml')) {
        const images = code.match(/\/src\/assets\/images\/[^\\"]+/g)
        if (images) {
          let imps = []
          let i = 0
          for (const image of images) {
            imps.push(`import _imports_${i} from '${image}'`)
            code = code.replace(image, `"+_imports_${i}+"`)
            i++
          }
          code = imps.join('\n') + '\n\n' + code
          return {
            code
          }
        }
      }
      return
    }
  }
}
