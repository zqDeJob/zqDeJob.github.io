'use strict'

/**
 * 新建文章或构建前，自动下载封面并写入 front matter 的 cover 字段
 * 配置见 _config.yml 的 auto_cover
 */

const path = require('path')
const { execFileSync } = require('child_process')

function getAutoCoverConfig () {
  return Object.assign(
    {
      enable: true,
      auto_fetch: true,
      write_fm: true
    },
    hexo.config.auto_cover || {}
  )
}

function runFetchForPost (postPath) {
  const cfg = getAutoCoverConfig()
  if (!cfg.enable || !cfg.auto_fetch) return

  const script = path.join(hexo.base_dir, 'tools', 'fetch-cover-one.mjs')
  const node = process.execPath

  try {
    execFileSync(node, [script, postPath], {
      cwd: hexo.base_dir,
      stdio: 'inherit',
      env: process.env
    })
    hexo.log.info('auto-fetch-cover: %s', path.relative(hexo.base_dir, postPath))
  } catch (e) {
    hexo.log.warn('auto-fetch-cover failed:', e.message)
  }
}

function fetchAllMissing () {
  const cfg = getAutoCoverConfig()
  if (!cfg.enable || !cfg.auto_fetch) return

  const script = path.join(hexo.base_dir, 'tools', 'fetch-all-covers.mjs')
  const node = process.execPath

  try {
    execFileSync(node, [script], {
      cwd: hexo.base_dir,
      stdio: cfg.quiet_fetch ? 'pipe' : 'inherit',
      env: process.env
    })
  } catch (e) {
    hexo.log.warn('auto-fetch-cover batch failed:', e.message)
  }
}

// hexo new "标题" 创建文章后
hexo.on('new', runFetchForPost)

// 构建 / 本地预览前，补全尚未下载封面的文章
hexo.extend.filter.register('before_generate', fetchAllMissing)
