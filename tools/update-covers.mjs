/**
 * 换一批封面风格：版本号 +1 后，强制重新下载所有文章封面
 *
 * 用法: pnpm run updateimg
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { bumpCoverRevision, readCoverRevision } from './cover-revision.mjs'
import { ensureAllPostCovers } from './fetch-cover-lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const prev = readCoverRevision(root)
const rev = bumpCoverRevision(root)

console.log(`封面风格版本：${prev} → ${rev}（各文章将使用新 seed 从 Picsum 拉图）\n`)

await ensureAllPostCovers(root, { writeFm: true, force: true, revision: rev, quiet: false })

console.log('\n完成。请 commit 更新的 source/img/covers/ 与 source/.cover-revision 后部署。')
