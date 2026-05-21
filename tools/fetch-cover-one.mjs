/**
 * 为单篇文章下载封面
 * node tools/fetch-cover-one.mjs <文章.md 路径>
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { ensureCoverForPost } from './fetch-cover-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const postPath = process.argv[2]

if (!postPath) {
  console.error('用法: node tools/fetch-cover-one.mjs <source/_posts/xxx.md>')
  process.exit(1)
}

const abs = path.isAbsolute(postPath) ? postPath : path.join(root, postPath)

ensureCoverForPost(abs, { root, writeFm: true })
  .catch(e => {
    console.error(e.message)
    process.exit(1)
  })
