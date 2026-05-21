/**
 * 单篇文章封面下载（供 hexo new / 构建前自动调用）
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import {
  COVER_WIDTH,
  COVER_HEIGHT,
  slugFromFilename,
  getSeed,
  picsumUrl,
  localCoverPath,
  parseFrontMatter,
  firstCategory,
  coverDisabled,
  hasCover
} from './cover-utils.mjs'

export function download (url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        if (fs.existsSync(dest)) fs.unlinkSync(dest)
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

export function upsertCoverInFrontMatter (raw, coverPath) {
  const line = `cover: ${coverPath}`
  if (/^cover:\s*.+$/m.test(raw)) {
    return raw.replace(/^cover:\s*.+$/m, line)
  }
  const end = raw.match(/^---\r?\n[\s\S]*?\r?\n---/)
  if (!end) return raw
  const insertAt = end.index + end[0].length
  return `${raw.slice(0, insertAt)}\n${line}${raw.slice(insertAt)}`
}

/**
 * @param {string} postFilePath 文章 md 绝对路径
 * @param {object} opts
 * @param {string} opts.root 项目根目录
 * @param {boolean} opts.writeFm 是否写入 front matter 的 cover
 * @param {boolean} opts.quiet
 */
export async function ensureCoverForPost (postFilePath, opts = {}) {
  const root = opts.root || path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  const outDir = path.join(root, 'source', 'img', 'covers')
  const writeFm = opts.writeFm !== false
  const quiet = opts.quiet === true

  if (!fs.existsSync(postFilePath)) {
    throw new Error(`文章不存在: ${postFilePath}`)
  }

  const raw = fs.readFileSync(postFilePath, 'utf8')
  const { fm } = parseFrontMatter(raw)

  if (coverDisabled(fm)) {
    if (!quiet) console.log('跳过（cover: false）')
    return { skipped: true, reason: 'disabled' }
  }
  if (hasCover(fm)) {
    if (!quiet) console.log('跳过（已有 cover）')
    return { skipped: true, reason: 'has_cover' }
  }

  const slug = slugFromFilename(path.basename(postFilePath))
  const dest = path.join(outDir, `${slug}.jpg`)
  const coverPath = localCoverPath(slug)

  if (fs.existsSync(dest) && writeFm && !hasCover(fm)) {
    fs.writeFileSync(postFilePath, upsertCoverInFrontMatter(raw, coverPath), 'utf8')
    if (!quiet) console.log(`${slug}: 已有封面图，已写入 front matter`)
    return { slug, coverPath, wroteFm: true, cached: true }
  }

  if (fs.existsSync(dest)) {
    return { slug, coverPath, cached: true }
  }

  const seed = getSeed(slug, firstCategory(raw))
  const url = picsumUrl(seed, COVER_WIDTH, COVER_HEIGHT)

  if (!quiet) process.stdout.write(`${slug} 下载封面 ... `)
  await download(url, dest)

  if (writeFm) {
    fs.writeFileSync(postFilePath, upsertCoverInFrontMatter(raw, coverPath), 'utf8')
  }

  if (!quiet) console.log(writeFm ? 'ok（已写入 cover）' : 'ok')
  return { slug, coverPath, wroteFm: writeFm }
}

export async function ensureAllPostCovers (root, opts = {}) {
  const postsDir = path.join(root, 'source', '_posts')
  if (!fs.existsSync(postsDir)) return []

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const results = []
  for (const file of files) {
    try {
      const r = await ensureCoverForPost(path.join(postsDir, file), {
        root,
        writeFm: opts.writeFm,
        quiet: opts.quiet
      })
      results.push({ file, ...r })
    } catch (e) {
      if (!opts.quiet) console.log(`${file} 失败:`, e.message)
      results.push({ file, error: e.message })
    }
  }
  return results
}
