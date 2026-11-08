import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATEGORY_ORDER = ['研发二三事', 'AI']
const LIFE_CATEGORY = '生活乐子'
const COMIC_MODULE = 'AI 漫剧'
const COMIC_GROUPS = ['AI 人物skill', 'AI 表情skill', 'AI 打斗skill']
const SKIP_DIRS = new Set(['public', '.vitepress', 'version', 'node_modules'])

interface PostEntry {
  text: string
  link: string
  category: string
  series: string
  date: string
}

type SidebarNode = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarNode[]
}

function parseFrontmatter (text: string): Record<string, string> {
  const matched = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!matched) return {}
  const data: Record<string, string> = {}
  for (const line of matched[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!kv) continue
    data[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return data
}

function collectPosts (dir: string, posts: PostEntry[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      collectPosts(path.join(dir, entry.name), posts)
      continue
    }
    if (entry.name !== 'index.md' || dir === docsRoot) continue
    const fm = parseFrontmatter(fs.readFileSync(path.join(dir, entry.name), 'utf8'))
    if (!fm.category || !fm.title) continue
    const rel = path.relative(docsRoot, dir).split(path.sep).join('/')
    posts.push({
      text: fm.title,
      link: `/${rel}/`,
      category: fm.category,
      series: fm.series || '',
      date: fm.date || ''
    })
  }
}

function sortPosts (posts: PostEntry[]) {
  return [...posts].sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text, 'zh'))
}

function dishAnchors (link: string): SidebarNode[] {
  const rel = link.replace(/^\/+|\/+$/g, '')
  const file = path.join(docsRoot, rel, 'index.md')
  const text = fs.readFileSync(file, 'utf8')
  const seen = new Map<string, number>()
  const items: SidebarNode[] = []
  let fence = false
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('```')) {
      fence = !fence
      continue
    }
    if (fence || !line.startsWith('## ')) continue
    const title = line.slice(3).trim()
    const count = seen.get(title) ?? 0
    seen.set(title, count + 1)
    const id = count === 0 ? title : `${title}-${count}`
    items.push({ text: title, link: `${link}#${id}` })
  }
  return items
}

const COOK_SKIP_ANCHORS = new Set(['总览', '厨房准备', '进阶知识'])

function linksOf (posts: PostEntry[]): SidebarNode[] {
  return sortPosts(posts).map((post) => {
    if (post.series === '程序员做饭指南' && !COOK_SKIP_ANCHORS.has(post.text)) {
      const items = dishAnchors(post.link)
      if (items.length > 0) {
        return {
          text: post.text,
          link: post.link,
          collapsed: true,
          items
        }
      }
    }
    return { text: post.text, link: post.link }
  })
}

function categoryItems (posts: PostEntry[], category: string): SidebarNode[] {
  const inCategory = posts.filter((post) => post.category === category)
  const loose = linksOf(inCategory.filter((post) => !post.series))
  const seriesNames = [...new Set(inCategory.map((post) => post.series).filter(Boolean))]
  seriesNames.sort((a, b) => {
    const dateOf = (name: string) => sortPosts(inCategory.filter((post) => post.series === name))[0]?.date || ''
    return dateOf(a).localeCompare(dateOf(b)) || a.localeCompare(b, 'zh')
  })
  const nested = seriesNames.map((name) => ({
    text: name,
    collapsed: true,
    items: linksOf(inCategory.filter((post) => post.series === name))
  })).filter((group) => group.items.length > 0)
  return [...loose, ...nested]
}

function buildSidebar () {
  const posts: PostEntry[] = []
  collectPosts(docsRoot, posts)
  const grouped = new Set([...CATEGORY_ORDER, LIFE_CATEGORY, ...COMIC_GROUPS])
  const extras = [...new Set(posts.map((post) => post.category))]
    .filter((category) => !grouped.has(category))

  const top = CATEGORY_ORDER
    .map((category) => ({
      text: category,
      collapsed: true,
      items: categoryItems(posts, category)
    }))
    .filter((group) => group.items.length > 0)

  const comicItems = COMIC_GROUPS
    .map((category) => ({
      text: category,
      collapsed: true,
      items: linksOf(posts.filter((post) => post.category === category))
    }))
    .filter((group) => group.items.length > 0)

  const lifeItems = categoryItems(posts, LIFE_CATEGORY)
  const lifeGroup = lifeItems.length > 0
    ? [{ text: LIFE_CATEGORY, collapsed: true, items: lifeItems }]
    : []

  const extraGroups = extras
    .map((category) => ({
      text: category,
      collapsed: true,
      items: linksOf(posts.filter((post) => post.category === category))
    }))
    .filter((group) => group.items.length > 0)

  const sidebar = [...top]
  if (comicItems.length > 0) {
    sidebar.push({
      text: COMIC_MODULE,
      collapsed: true,
      items: comicItems
    })
  }
  // 顺序：研发二三事 → AI → AI 漫剧 → 生活乐子 → 其他
  return [...sidebar, ...lifeGroup, ...extraGroups]
}

export default defineConfig({
  title: 'zqDeJob避风塘',
  description: '随时随地，记录生活之文字版',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: [/^https?:\/\/localhost(?::\d+)?/],
  head: [
    ['link', { rel: 'icon', href: '/img/logo.png' }]
  ],
  themeConfig: {
    logo: '/img/logo.png',
    siteTitle: 'zqDeJob避风塘',
    nav: [
      { text: '首页', link: '/' },
      { text: '收藏 link', link: '/bookmarks/' },
      { text: '版本', link: '/version/' }
    ],
    sidebar: buildSidebar(),
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一章', next: '下一章' },
    lastUpdated: {
      text: '最后更新'
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色',
    darkModeSwitchTitle: '切换到深色',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索'
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除',
                backButtonTitle: '关闭',
                noResultsText: '没有结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上',
                  navigateDownKeyAriaLabel: '下',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'esc'
                }
              }
            }
          }
        }
      }
    },
    editLink: {
      pattern: 'https://github.com/zqDeJob/zqDeJob.github.io/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    footer: {
      message: '个人笔记',
      copyright: 'zqDeJob'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zqDeJob/zqDeJob.github.io' }
    ]
  }
})
