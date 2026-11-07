import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import Comments from './Comments.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout () {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(Comments)
    })
  }
} satisfies Theme
