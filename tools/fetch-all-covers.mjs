/**
 * 为所有缺封面的文章下载并写入 cover（构建前自动调用）
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { ensureAllPostCovers } from './fetch-cover-lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const quiet = process.argv.includes('--quiet')

await ensureAllPostCovers(root, { writeFm: true, quiet })
