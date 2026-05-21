'use strict'

/**
 * 根据 source/_data/gallery.yml 生成画廊页面
 * 注意：Markdown 会把「行首 4 空格缩进」的 HTML 当成代码块，故 HTML 必须顶格写
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { writeIfChanged } = require('./lib/write-if-changed')

const FRONT_MATTER = `---
title: 画廊
date: 2026-05-21 14:00:00
type: page
comments: false
top_img: false
aside: false
---

<link rel="stylesheet" href="/css/gallery.css">
`

function escapeHtml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function loadGalleryData () {
  const file = path.join(hexo.source_dir, '_data', 'gallery.yml')
  if (!fs.existsSync(file)) {
    hexo.log.warn('generate-gallery: missing source/_data/gallery.yml')
    return { people: [], works: { movies: [], tv: [], novels: [] } }
  }
  return yaml.load(fs.readFileSync(file, 'utf8')) || {}
}

function renderPeople (list) {
  if (!list || !list.length) return ''
  const cards = list
    .map(
      p =>
        `<article class="gallery-card">
<div class="gallery-card__frame gallery-card__frame--portrait">
<img class="gallery-card__img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />
</div>
<div class="gallery-card__body">
<h3 class="gallery-card__name">${escapeHtml(p.name)}</h3>
<p class="gallery-card__note">${escapeHtml(p.note || '')}</p>
</div>
</article>`
    )
    .join('\n')

  return `<section class="gallery-section">
<h2 class="gallery-section-title">公众人物</h2>
<p class="gallery-section-desc">不同人生阶段里，让我觉得有意思、值得留一格的人。</p>
<div class="gallery-grid gallery-grid--people">
${cards}
</div>
</section>`
}

function renderWorkCards (items) {
  if (!items || !items.length) return '<p class="gallery-section-desc">暂无记录</p>'
  return items
    .map(
      w =>
        `<article class="gallery-card">
<div class="gallery-card__frame gallery-card__frame--landscape">
<img class="gallery-card__img" src="${escapeHtml(w.image)}" alt="${escapeHtml(w.title)}" loading="lazy" />
</div>
<div class="gallery-card__body">
<h3 class="gallery-card__name">${escapeHtml(w.title)}</h3>
<p class="gallery-card__note">${escapeHtml(w.note || '')}</p>
</div>
</article>`
    )
    .join('\n')
}

function renderWorks (works) {
  const w = works || {}
  const groups = [
    { key: 'movies', label: '电影', icon: 'fas fa-film' },
    { key: 'tv', label: '电视剧', icon: 'fas fa-tv' },
    { key: 'novels', label: '小说', icon: 'fas fa-book' }
  ]

  const inner = groups
    .map(
      g =>
        `<div class="gallery-works-group">
<h3 class="gallery-works-label"><i class="${g.icon}" aria-hidden="true"></i>${g.label}</h3>
<div class="gallery-grid gallery-grid--works">
${renderWorkCards(w[g.key])}
</div>
</div>`
    )
    .join('\n')

  return `<section class="gallery-section">
<h2 class="gallery-section-title">影像与文字</h2>
<p class="gallery-section-desc">电影、电视剧、小说——留下过印象的作品。</p>
${inner}
</section>`
}

function buildPage () {
  const data = loadGalleryData()
  return `${FRONT_MATTER}
<div class="gallery-page">
<p class="gallery-intro">【人生是段旅程，不同的时刻有不同的风景~】</p>
${renderPeople(data.people)}
${renderWorks(data.works)}
</div>
`
}

function writeGalleryPage () {
  const file = path.join(hexo.source_dir, 'gallery', 'index.md')
  if (writeIfChanged(file, buildPage())) {
    hexo.log.info('generate-gallery: updated %s', path.relative(hexo.base_dir, file))
  }
}

hexo.extend.filter.register('before_generate', writeGalleryPage)
