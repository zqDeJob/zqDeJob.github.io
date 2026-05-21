/**
 * 封面 seed / slug 工具（与 scripts/auto-cover.js 逻辑一致）
 */

export const COVER_WIDTH = 800
export const COVER_HEIGHT = 450

export function slugFromFilename (name) {
  const base = name.replace(/\.md$/, '')
  const m = base.match(/^\d{4}-\d{2}-\d{2}-(.+)$/)
  return m ? m[1] : base
}

export function getSeed (slug, category) {
  const parts = []
  if (category) parts.push(category)
  parts.push(slug)
  return encodeURIComponent(parts.join('-'))
}

export function picsumUrl (seed, width = COVER_WIDTH, height = COVER_HEIGHT) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

export function localCoverPath (slug) {
  return `/img/covers/${slug}.jpg`
}

export function parseFrontMatter (raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { fm: {}, bodyStart: 0 }
  const fm = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/)
    if (m) fm[m[1]] = m[2].trim()
  }
  return { fm, bodyStart: match[0].length }
}

export function firstCategory (raw) {
  const inline = raw.match(/^categories:\s*(.+)$/m)
  if (inline) return inline[1].replace(/^\s*-\s*/, '').trim()
  const list = raw.match(/categories:\s*\n\s*-\s*(.+)/)
  return list ? list[1].trim() : ''
}

export function coverDisabled (fm) {
  const v = fm.cover
  return v === false || v === 'false'
}

export function hasCover (fm) {
  return fm.cover && !coverDisabled(fm)
}
