/**
 * 为所有缺封面的文章下载并写入 cover（构建前自动调用）
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { ensureAllPostCovers } from './fetch-cover-lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const quiet = process.argv.includes('--quiet') || process.argv.includes('-q')

if (!quiet) {
  console.log('批量检查封面（仅处理缺失项）…')
}
await ensureAllPostCovers(root, { writeFm: true, quiet })
