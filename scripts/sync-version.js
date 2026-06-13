'use strict'

/**
 * 独立脚本：从 git log 刷新 source/version/index.md
 * 用法：node scripts/sync-version.js
 */

const path = require('path')
const fs = require('fs')
const { syncVersionPage } = require('./lib/version-page')

const repoRoot = path.join(__dirname, '..')
const configPath = path.join(repoRoot, '_config.yml')

function loadHexoConfig () {
  try {
    const text = fs.readFileSync(configPath, 'utf8')
    const repo = {}
    const github = text.match(/^\s*github:\s*(.+)\s*$/m)
    const branch = text.match(/^\s*branch:\s*(.+)\s*$/m)
    const limit = text.match(/^\s*changelog_limit:\s*(\d+)\s*$/m)
    if (github) repo.github = github[1].trim()
    if (branch) repo.branch = branch[1].trim()
    if (limit) repo.changelog_limit = Number(limit[1])
    return { repo }
  } catch {
    return {}
  }
}

const { changed, file } = syncVersionPage({
  repoRoot,
  sourceDir: path.join(repoRoot, 'source'),
  hexoConfig: loadHexoConfig(),
  log: console
})

if (changed) {
  console.log('Updated', path.relative(repoRoot, file))
} else {
  console.log('Version page already up to date')
}
