/**
 * 封面风格版本号：存在 source/.cover-revision
 * getimg 使用当前版本；updateimg 会先 +1 再按新版本重新拉图
 */

import fs from 'fs'
import path from 'path'

const REV_REL = path.join('source', '.cover-revision')

export function revisionFile (root) {
  return path.join(root, REV_REL)
}

export function readCoverRevision (root) {
  const file = revisionFile(root)
  if (!fs.existsSync(file)) return 0
  const n = parseInt(fs.readFileSync(file, 'utf8').trim(), 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function bumpCoverRevision (root) {
  const next = readCoverRevision(root) + 1
  fs.mkdirSync(path.dirname(revisionFile(root)), { recursive: true })
  fs.writeFileSync(revisionFile(root), `${next}\n`, 'utf8')
  return next
}

export function writeCoverRevision (root, rev) {
  fs.mkdirSync(path.dirname(revisionFile(root)), { recursive: true })
  fs.writeFileSync(revisionFile(root), `${rev}\n`, 'utf8')
}
