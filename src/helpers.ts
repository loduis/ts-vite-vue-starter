export const isServer = import.meta.env.SSR
export const isClient = !isServer

export function hasOwn(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object || {}, key)
}

export function resolvePath(path: string) {
  return (isServer ? import.meta.env.VITE_SITE : location.origin) + path
}

export function isFunction(object: object) {
  return typeof object === 'function'
}

export function globMap(obj: object, ext: string | RegExp = /\.(vue|ts|js)$/) {
  return Object.entries(obj).reduce((obj: any, [key, value]) => {
    key = key.replace('./', '')
    let start = key.indexOf('/')
    key = key.substring(start + 1)
    if (ext) {
      if (ext instanceof RegExp) {
        const match = key.match(ext)
        if (match !== null) {
          key = key.replace(match[0], '')
        }
      } else {
        key = key.replace(ext, '')
      }
    }
    key = key.replaceAll('/', '')
    obj[key] = value
    return obj
  }, {})
}

export function slugify(value: string) {
  return value
    .toString()
    .toLowerCase()
    .replace(/á/gi, 'a')
    .replace(/é/gi, 'e')
    .replace(/í/gi, 'i')
    .replace(/ó/gi, 'o')
    .replace(/ú/gi, 'u')
    .replace(/ñ/gi, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}
