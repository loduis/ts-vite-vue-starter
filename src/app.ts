import {
  defineAsyncComponent,
  defineComponent,
  createSSRApp as createApp,
  App,
  withCtx,
  h,
  resolveComponent
} from 'vue'
import { state } from './store'
import { useHead, createHead } from 'unhead'
import { isClient, isFunction, globMap } from './helpers'
import Router from './router'
import Loader from './content'
import { RouteLocationNormalized, RouterView } from 'vue-router'

const components = globMap(import.meta.glob('./components/**/*.*'))
const views = globMap(import.meta.glob('./views/**/*.*'))

const Root = defineComponent({
  render() {
    return h(RouterView, null, {
      default: withCtx(({ Component }) => [
        h(resolveComponent('layout-header')),
        h(Component),
        h(resolveComponent('layout-footer'))
      ])
    })
  }
})

const MarkDown = defineComponent({
  render() {
    return h('main', null, {
      default: () => [
        h(resolveComponent('mark-down'), { elements: state.main.markdown })
      ]
    })
  }
})

export default class {
  private router: Router
  private content: Loader
  public head: any
  constructor(router: Router, content: Loader) {
    this.router = router
    this.content = content
  }
  async mount(selector: string) {
    const { app } = await this.dispatch()
    app.mount(selector)
  }
  get routes(): Array<any> {
    return this.router.routes
  }
  async dispatch(
    url: string | undefined = undefined
  ): Promise<{ app: App; head: any }> {
    const head = createHead()
    const router = this.router.generate(this.resolve.bind(this))
    const app = createApp(Root)
    this.resolveComponents(app)
    app.use(router)
    await this.router.dispatch(url)
    return {
      app,
      head
    }
  }
  async resolve(name: string, content: boolean = true) {
    let component = views[name] || MarkDown
    if (isFunction(component)) {
      component = await component()
      views[name] = component
    }
    if (content) {
      await this.prepareComponent(component)
    }
    return component
  }
  resolveComponents(app: App) {
    for (const name in components) {
      let component = components[name]
      app.component(
        name,
        defineAsyncComponent(async () => {
          if (isFunction(component)) {
            component = await component()
          }
          return this.prepareComponent(component)
        })
      )
    }
  }
  public get route(): RouteLocationNormalized | undefined {
    return this.router.curRoute
  }
  async prepareComponent(component: any) {
    if (component.default) {
      component = component.default
    }
    let route = this.route
    if (route && route.meta.content !== false) {
      if (!component.resolved) {
        await this.resolveComputed(component)
        this.resolveHead(component)
      }
      if (component.fetch) {
        const data = await component.fetch(this.content, route)
        component.data = function () {
          return data
        }
        component.beforeUpdate = async function () {
          const data = await component.fetch(this.content, route)
          for (const key in data) {
            this[key] = data[key]
          }
        }
      }
    }
    component.resolved = true
    return component
  }

  async resolveComputed(component: any) {
    const data: {
      _h: {} // header data
      _m: {} // content data
      _f: {} // footer data sort cut for use
      lang: () => string
      title?: () => string
      description: () => string
    } = {
      _h() {
        return state.header
      },
      _m(): any {
        return state.main
      },
      _f(): any {
        return state.footer
      },
      lang: () => state.lang,
      description: () => state.description
    }
    if (!isClient) {
      data.title = function () {
        return state.title
      }
    }
    if (component.content && typeof component.content === 'string') {
      data._m = () => state.main[component.content]
    }
    component.computed = Object.assign({}, component.computed || {}, data)
  }

  resolveHead(component: any) {
    let head: any
    if ((head = component.head)) {
      component.setup = function () {
        if (isFunction(head)) {
          head = head(this.route)
        }
        if (head) {
          useHead(head)
        }
      }
    }
  }
}
