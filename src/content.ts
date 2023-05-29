import { hasOwn, isServer, globMap, isFunction } from './helpers'
import { state, commit } from './store'
import { RouteLocationNormalized } from 'vue-router'

type Layout = {
  title?: string
  description?: string
  header?: any
  main?: any
  footer?: any
}

const contents = globMap(import.meta.glob('./content/**/*.*'), /\.(yml|md)$/)

export default class Loader {
  // private basePath: string
  // private langs: Array<string>
  // private exts: Array<string>
  private lang?: string
  private hasLayout: boolean = false
  private hanlders: Array<Function>
  constructor(
    // path: string,
    // langs: Array<string> = ['es', 'en'],
    hanlders: Array<Function> = []
    // exts: Array<string> = ['yml', 'md']
  ) {
    // guarda los imports para resolver
    // los componentes a la hora de generar la data
    // this.langs = langs
    // this.exts = exts
    // this.basePath = path
    this.hanlders = hanlders
  }

  async fetch(path: string): Promise<Layout> {
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    return this.get(this.lang + path)
  }

  async get(path: string): Promise<Layout | never> {
    /*
    for (const ext of this.exts) {
      try {
        path = `./${this.basePath}/${path}.${ext}`
        contents[]
        const module = await import(path)
        return module.default
      } catch (e) {
        console.log(e)
      }
    }
    */
    const key = path.replaceAll('/', '')
    let callback = contents[key]
    if (isFunction(callback)) {
      const module = await callback()
      callback = module.default
      contents[key] = callback
    }
    if (callback !== undefined) {
      return callback
    }
    throw new Error('Not found path: ' + path)
    /*
    return {
      title: '',
      description: '',
      header: {},
      main: {},
      footer: {}
    }*/
  }

  private async layout(name: string): Promise<Layout> {
    return await this.fetch('layouts/' + name)
  }
  async resolveFromMaster(master: string) {
    return await this.fetch(master)
  }

  async resolve({ path, meta, params }: RouteLocationNormalized) {
    const master = meta.master as string
    this.hasLayout = false
    if (master) {
      return await this.resolveFromMaster(master)
    }
    for (const handler of this.hanlders) {
      const res = handler(path, params)
      if (res !== false) {
        return res
      }
    }
    return this.fetch(path)
  }

  async load(route: RouteLocationNormalized): Promise<boolean> {
    let layout
    let main: object = state.main || {}
    this.lang = route.meta.lang as string
    try {
      if (isServer || state.lang !== this.lang || this.hasLayout) {
        layout = await this.layout('default')
        main = layout.main || {}
      }
      const content = await this.resolve(route)
      if (hasOwn(content, 'main')) {
        content.main = Object.assign({}, main, content.main)
      } else {
        content.main = Object.assign({}, main)
      }
      /*
      for (const key in content) {
        commit(key, content[key])
      }
      */
      if (layout) {
        commit('header', layout.header || {})
        commit('footer', layout.footer || {})
      }
      commit('main', content.main)
      commit('title', content.title)
      commit('description', content.description)
      commit('lang', this.lang)
      // content.path = route.path
      // update content in one step
      return true
    } catch (e) {
      console.log(e)
      return false
    }
  }
}
