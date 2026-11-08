import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import BookmarkList from './BookmarkList.vue'
import CarViewDemo from './CarViewDemo.vue'
import Comments from './Comments.vue'
import DinoGame from './DinoGame.vue'
import FaceParallaxDemo from './FaceParallaxDemo.vue'
import PanelHoverDemo from './PanelHoverDemo.vue'
import SiteStats from './SiteStats.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp ({ app }) {
    app.component('BookmarkList', BookmarkList)
    app.component('CarViewDemo', CarViewDemo)
    app.component('DinoGame', DinoGame)
    app.component('FaceParallaxDemo', FaceParallaxDemo)
    app.component('PanelHoverDemo', PanelHoverDemo)
  },
  Layout () {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(SiteStats),
      'doc-after': () => h(Comments)
    })
  }
} satisfies Theme
