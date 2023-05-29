import { h, markRaw, resolveComponent, defineComponent } from 'vue'
import { useSeoMeta } from 'unhead'
import { resolvePath } from '../helpers'

let Shared, meta

const images = import.meta.glob('/src/assets/images/*.*', { eager: true })

export default defineComponent({
  props: {
    elements: {
      type: Array,
      default: () => []
    },
    share: {
      type: Object,
      default: () => null
    }
  },
  setup(props) {
    if (!Shared) {
      Shared = markRaw(resolveComponent('SocialShare'))
    }
    meta = void 0
    if (props.share !== null) {
      addMeta(props.share)
    }
    const entries = create(props.elements)
    if (meta) {
      useSeoMeta(meta)
    }
    return () => entries
  }
})

function addMeta(info) {
  meta = {
    twitterCard: 'summary_large_image',
    ogImage: resolvePath(info.src),
    twitterImageAlt: info.alt
  }
}

function create(entries, i) {
  const result = []
  let id = 0
  for (let entry of entries) {
    if (entry.type === 'element') {
      let hasShared = false
      for (const child of entry.children) {
        if (child.type === 'element' && child.tag === 'social-share') {
          hasShared = true
          break
        }
      }
      const children = create(entry.children)
      const tag = entry.tag
      const isImg = tag === 'img'
      let props = Object.assign({}, entry.props)
      if (isImg) {
        props.class = 'w-full rounded-lg'
        if (props.dataShare === 'true') {
          addMeta(props)
          props['data-share'] = props.dataShare
          delete props.dataShare
        }
        if (!props.width) {
          props.width = '640'
        }
        if (!props.height) {
          props.height = '360'
        }
        if (props.dataBorder === '0') {
          props['data-border'] = props.dataBorder
          delete props.dataBorder
        }
      } else if (tag === 'a' && props.href.includes('/images/')) {
        props.href = resolve(props.href)
      }
      if (hasShared) {
        props = Object.assign(props || {}, {
          class: 'flex items-center'
        })
      }
      if (entry.tag === 'h2') {
        props.id = 'section-' + ++id
        props.className = 'head-2xl md:head-3xl'
      }
      const el =
        tag === 'social-share'
          ? h(Shared, props, () => children)
          : h(entry.tag, props, children)
      result.push(el)
    } else if (entry.type === 'text') {
      result.push(entry.value)
    }
  }
  return result
}

function resolve(path: string): string {
  let src = path
  if (src.startsWith('/images/')) {
    src = '/src/assets' + src
  }
  return (images[src] as string) || path
}
