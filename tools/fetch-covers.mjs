/**
 * 批量下载文章封面（手动执行 pnpm run getimg 时调用）
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { ensureAllPostCovers } from './fetch-cover-lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const writeFm = !process.argv.includes('--no-write-fm')

console.log(`批量下载封面到 source/img/covers/${writeFm ? '，并写入 cover 字段' : ''}`)
await ensureAllPostCovers(root, { writeFm, quiet: false })
console.log('\n完成。')
