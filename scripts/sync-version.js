'use strict'

/**
 * 从 git log 刷新 docs/version/index.md
 * 用法：node scripts/sync-version.js
 */

const path = require('path')
const { syncVersionPage } = require('./lib/version-page')

const repoRoot = path.join(__dirname, '..')

const { changed, file } = syncVersionPage({
  repoRoot,
  docsDir: path.join(repoRoot, 'docs'),
  log: console
})

if (changed) {
  console.log('Updated', path.relative(repoRoot, file))
} else {
  console.log('Version page already up to date')
}
