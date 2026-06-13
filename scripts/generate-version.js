'use strict'

/**
 * Hexo 构建前根据本地 git log 生成「版本」页面（source/version/index.md）
 * 配置见 _config.yml 的 repo
 */

const { syncVersionPage } = require('./lib/version-page')

hexo.extend.filter.register('before_generate', () => {
  syncVersionPage({
    repoRoot: hexo.base_dir,
    sourceDir: hexo.source_dir,
    hexoConfig: hexo.config,
    log: hexo.log
  })
})
