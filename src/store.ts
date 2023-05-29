import { reactive, UnwrapNestedRefs } from 'vue'

export const state: UnwrapNestedRefs<any> = reactive({
  type: 'website',
  lang: '',
  title: '',
  description: '',
  header: {},
  footer: {},
  main: {}
})

export function commit(key: string, value: any) {
  state[key] = value
}
