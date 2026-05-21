/**
 * 从百度百科词条拉取人物头图（posterBg_* 的 background-image）
 *
 * 用法: pnpm run gallery:img
 * 配置: source/_data/gallery.yml → people[].baike、people[].image 或 people[].file
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const galleryYml = path.join(root, 'source', '_data', 'gallery.yml')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const POSTER_BG_RE =
  /class="posterBg_[^"]*"[^>]*style="background-image:url\(([^)]+)\)/i

function parsePeople (raw) {
  const people = []
  const blocks = raw.split(/\n  - name:/)
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const name = block.match(/^\s*(.+)/)?.[1]?.trim()
    const file = block.match(/^\s*file:\s*(\S+)/m)?.[1]?.trim()
    const baike = block.match(/^\s*baike:\s*(.+)/m)?.[1]?.trim()
    const image = block.match(/^\s*image:\s*(.+)/m)?.[1]?.trim()
    if (name) people.push({ name, file, baike, image })
  }
  return people
}

function fetchHtml (url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        }
      },
      res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location
          const next = loc.startsWith('http') ? loc : new URL(loc, url).href
          return fetchHtml(next).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url}`))
          return
        }
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      }
    )
    req.on('error', reject)
  })
}

function extractPosterUrl (html) {
  const m = html.match(POSTER_BG_RE)
  if (m) return m[1].trim().replace(/^['"]|['"]$/g, '')
  const fallback = html.match(
    /posterBg_\w+[^>]*background-image:\s*url\(['"]?([^'")]+)['"]?\)/i
  )
  return fallback ? fallback[1].trim() : null
}

function resolveBaikeUrl (entry) {
  if (entry.baike) {
    const u = entry.baike.trim()
    if (u.startsWith('http')) return u
    return `https://baike.baidu.com/item/${encodeURIComponent(u)}`
  }
  if (entry.name) {
    return `https://baike.baidu.com/item/${encodeURIComponent(entry.name)}`
  }
  return null
}

function download (url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    const file = fs.createWriteStream(dest)
    lib
      .get(url, { headers: { 'User-Agent': UA, Referer: 'https://baike.baidu.com/' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          if (fs.existsSync(dest)) fs.unlinkSync(dest)
          const loc = res.headers.location
          const next = loc.startsWith('http') ? loc : new URL(loc, url).href
          return download(next, dest).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for image`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      })
      .on('error', reject)
  })
}

function destPath (entry) {
  if (entry.image && entry.image.startsWith('/img/')) {
    return path.join(root, 'source', entry.image.replace(/^\//, '').replace(/\//g, path.sep))
  }
  const id = entry.file || entry.name
  return path.join(root, 'source', 'img', 'gallery', 'people', `${id}.jpg`)
}

async function main () {
  if (!fs.existsSync(galleryYml)) {
    console.error('未找到 source/_data/gallery.yml')
    process.exit(1)
  }

  const raw = fs.readFileSync(galleryYml, 'utf8')
  const people = parsePeople(raw)

  for (const person of people) {
    const url = resolveBaikeUrl(person)
    if (!url) {
      console.log(`跳过 ${person.name}（未配置 baike）`)
      continue
    }

    const dest = destPath(person)
    process.stdout.write(`${person.name} ← 百度百科 ... `)
    try {
      const html = await fetchHtml(url)
      const imgUrl = extractPosterUrl(html)
      if (!imgUrl) {
        console.log('失败（未找到 posterBg 背景图）')
        continue
      }
      await download(imgUrl, dest)
      console.log('ok →', path.relative(root, dest))
    } catch (e) {
      console.log('失败', e.message)
    }
  }

  console.log('\n完成。请重新 build / server 查看画廊。')
}

main()
