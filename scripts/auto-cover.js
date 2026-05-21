'use strict'

/**
 * 为未设置 cover 的文章自动分配封面（按分类 + slug 稳定配图）
 * 配置见 _config.yml 的 auto_cover
 */

const imgTestReg = /\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i

function getConfig () {
  return Object.assign(
    {
      enable: true,
      provider: 'picsum',
      width: 800,
      height: 450
    },
    hexo.config.auto_cover || {}
  )
}

function getSeed (article) {
  const parts = []
  const cats = article.categories
  if (cats && cats.length) {
    const name = cats.data ? cats.data[0].name : cats[0]
    if (name) parts.push(name)
  }
  parts.push(article.slug || article.title || 'post')
  return encodeURIComponent(parts.join('-'))
}

function picsumUrl (article, cfg) {
  const { width, height } = cfg
  return `https://picsum.photos/seed/${getSeed(article)}/${width}/${height}`
}

function localCoverPath (article) {
  return `/img/covers/${article.slug}.jpg`
}

function resolveCover (article, cfg) {
  const { provider } = cfg
  if (provider === 'local') {
    const fs = require('fs')
    const path = require('path')
    const file = path.join(hexo.source_dir, 'img', 'covers', `${article.slug}.jpg`)
    return fs.existsSync(file) ? localCoverPath(article) : picsumUrl(article, cfg)
  }
  return picsumUrl(article, cfg)
}

function coverDisabled (article) {
  return article && (article.cover === false || article.cover === 'false')
}

function applyCover (article, cfg) {
  if (!cfg.enable || !article || coverDisabled(article) || article.cover) return

  const cover = resolveCover(article, cfg)
  article.cover = cover
  if (cover.includes('//') || imgTestReg.test(cover)) {
    article.cover_type = 'img'
  }
}

function applyToPosts (posts, cfg) {
  if (!posts) return
  const list = posts.data || posts
  if (!list || !list.length) return
  list.forEach(article => applyCover(article, cfg))
}

function applyToAllPosts (cfg) {
  if (!cfg.enable) return

  const posts = hexo.locals.get('posts')
  if (posts && posts.length) applyToPosts(posts, cfg)

  const Post = hexo.model('Post')
  if (Post) {
    Post.find({}).forEach(post => applyCover(post, cfg))
  }
}

hexo.extend.filter.register('after_load', () => {
  applyToAllPosts(getConfig())
})

hexo.extend.filter.register('after_init', () => {
  applyToAllPosts(getConfig())
})

hexo.extend.filter.register('before_generate', () => {
  applyToAllPosts(getConfig())
})

hexo.extend.filter.register('before_post_render', data => {
  applyCover(data, getConfig())
  return data
})

hexo.extend.filter.register('template_locals', locals => {
  const cfg = getConfig()
  if (!cfg.enable || !locals.page) return locals

  applyToPosts(locals.page.posts, cfg)

  if (locals.page.__post || locals.page.layout === 'post') {
    applyCover(locals.page, cfg)
  }

  return locals
})
