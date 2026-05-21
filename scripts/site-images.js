'use strict'

/**
 * 将 _config.yml 的 site_images 同步到 Butterfly 主题配置
 * 主页顶图等统一在 _config.yml 维护（如 home-page.png）
 */

function applySiteImages () {
  const site = hexo.config.site_images
  if (!site || !hexo.theme || !hexo.theme.config) return

  const tc = hexo.theme.config
  const home = site.home_page || site.default_top

  if (home) {
    tc.index_img = home
    tc.default_top_img = site.default_top || home
  }

  if (site.categories && typeof site.categories === 'object') {
    tc.category_per_img = Object.assign({}, tc.category_per_img || {}, site.categories)
  }
}

hexo.on('ready', applySiteImages)
hexo.extend.filter.register('after_init', applySiteImages)
