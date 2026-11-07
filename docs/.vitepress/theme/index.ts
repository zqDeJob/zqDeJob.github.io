import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import Comments from './Comments.vue'
import SiteStats from './SiteStats.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout () {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(SiteStats),
      'doc-after': () => h(Comments)
    })
  }
} satisfies Theme
