/**
 * 将文章封面下载到 source/img/covers/{slug}.jpg
 * 使用与 scripts/auto-cover.js 相同的 Picsum seed
 *
 * 用法:
 *   pnpm run covers:fetch
 *   pnpm run covers:fetch -- --write-fm   # 下载后写入文章 front matter 的 cover 字段
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const postsDir = path.join(root, 'source', '_posts')
const outDir = path.join(root, 'source', 'img', 'covers')
const writeFm = process.argv.includes('--write-fm')

function download (url, dest) {
  return new Promise((resolve, reject) => {
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

function upsertCoverInFrontMatter (raw, coverPath) {
  const line = `cover: ${coverPath}`
  if (/^cover:\s*.+$/m.test(raw)) {
    return raw.replace(/^cover:\s*.+$/m, line)
  }
  const end = raw.match(/^---\r?\n[\s\S]*?\r?\n---/)
  if (!end) return raw
  const insertAt = end.index + end[0].length
  return `${raw.slice(0, insertAt)}\n${line}${raw.slice(insertAt)}`
}

async function main () {
  if (!fs.existsSync(postsDir)) {
    console.error('未找到 source/_posts')
    process.exit(1)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  console.log(`共 ${files.length} 篇文章，下载封面到 source/img/covers/`)
  if (writeFm) console.log('已开启 --write-fm：将 cover 写入各文章 front matter')

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const raw = fs.readFileSync(filePath, 'utf8')
    const { fm } = parseFrontMatter(raw)

    if (coverDisabled(fm)) {
      console.log(`跳过 ${file}（cover: false）`)
      continue
    }
    if (hasCover(fm)) {
      console.log(`跳过 ${file}（已有 cover）`)
      continue
    }

    const slug = slugFromFilename(file)
    const category = firstCategory(raw)
    const seed = getSeed(slug, category)
    const url = picsumUrl(seed, COVER_WIDTH, COVER_HEIGHT)
    const dest = path.join(outDir, `${slug}.jpg`)
    const coverPath = localCoverPath(slug)

    process.stdout.write(`${slug} ... `)
    try {
      await download(url, dest)
      if (writeFm) {
        fs.writeFileSync(filePath, upsertCoverInFrontMatter(raw, coverPath), 'utf8')
      }
      console.log(writeFm ? 'ok（已写入 front matter）' : 'ok')
    } catch (e) {
      console.log('失败', e.message)
    }
  }

  console.log('\n完成。若需使用本地图，在 _config.yml 设置 auto_cover.provider: local')
}

main()
