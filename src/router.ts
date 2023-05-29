import { resolvePath, isClient } from './helpers'
import { useHead, useSeoMeta } from 'unhead'
import { state } from './store'
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  Router,
  RouteLocationNormalized,
  NavigationGuardNext
} from 'vue-router'
import Loader from './content'
import { RouteRecordRaw } from 'vue-router'

export default class {
  private handler: Router
  public curRoute?: RouteLocationNormalized
  private started: boolean = false
  private notFound: boolean = false
  private loader: Loader
  private resolve: Function = async () => {}
  public routes: Array<any>
  constructor(
    loader: Loader,
    routes: Record<string, Record<string, string | string[]>>
  ) {
    this.routes = this.create(routes)
    this.loader = loader
  }
  generate(resolve: Function) {
    this.resolve = resolve
    this.handler = createRouter({
      history: isClient ? createWebHistory() : createMemoryHistory(),
      routes: this.routes
    })
    this.handler.beforeEach(this.before.bind(this))
    this.handler.afterEach(this.after.bind(this))
    return this.handler
  }
  create(
    entries: Record<string, Record<string, string | string[]>>
  ): RouteRecordRaw[] {
    const routes: RouteRecordRaw[] = []
    for (const lang in entries) {
      const line: Record<string, string | string[]> = entries[lang]
      for (const view in line) {
        let paths = line[view]
        if (!Array.isArray(paths)) {
          paths = [paths]
        }
        for (let path of paths) {
          if (!path.startsWith('/')) {
            path = '/' + path
          }
          routes.push({
            name: lang + '.' + view,
            path,
            component: () => this.resolver(view),
            meta: {
              lang,
              master: view
            },
            props: {
              className: view
            }
          })
        }
      }
    }
    routes.push({
      name: '404',
      path: '/:pathMatch(.*)*',
      component: () => this.resolver('404'),
      meta: {
        lang: Object.keys(entries)[0],
        master: '404'
      },
      props: {
        className: '404'
      }
    })
    return routes
  }
  async resolver(name: string) {
    if (this.notFound) {
      name = '404'
    }
    return this.resolve(name)
  }
  async dispatch(url: string | undefined = undefined) {
    if (url) {
      this.handler.push(url)
    }
    return this.handler.isReady()
  }
  async before(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) {
    if (isClient) {
      window.scroll(0, 0)
      this.gtag('start')
    }
    this.notFound = to.name === '404'
    if (to.meta.content === false) {
      return next()
    }
    if (!(await this.loader.load((this.curRoute = to)))) {
      this.notFound = true
    }
    if (!hasQueryParams(to) && hasQueryParams(from)) {
      to.query = from.query
      next(to)
    } else {
      next()
    }
    if (!this.notFound) {
      setMeta(to)
    }
  }
  after() {
    this.gtag('history')
    this.started = true
  }
  gtag(action: string): void {
    if (isClient && this.started && 'gtag' in globalThis) {
      globalThis.gtag(action)
    }
  }
}

function hasQueryParams(route: RouteLocationNormalized) {
  return !!Object.keys(route.query).length
}

function setMeta(route: RouteLocationNormalized) {
  const title = state.title
  const description = state.description
  const type = state.type
  const url = resolvePath(route.path)
  const lang = state.lang
  useHead({
    htmlAttrs: {
      lang
    },
    title: title,
    meta: [
      {
        name: 'description',
        content: description
      }
    ]
  })
  useHead(
    {
      bodyAttrs: {
        class: ''
      }
    },
    { mode: 'client' }
  )
  useSeoMeta({
    description: description,
    ogDescription: description,
    ogTitle: title,
    ogUrl: url,
    ogType: type
  })
}
