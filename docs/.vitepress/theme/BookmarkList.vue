<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const GIST_ID = '8a3a930c2650785a7f84c7a822cdcab4'
const GIST_FILE = 'z-bookmark.json'
const GIST_URL = `https://gist.githubusercontent.com/zqDeJob/${GIST_ID}/raw/${GIST_FILE}`
const GIST_PAGE = `https://gist.github.com/zqDeJob/${GIST_ID}`
const PIN_KEY = 'zqdejob-bookmark-pins'

interface Site {
  name: string
  url: string
  description: string
  icon: string
  parent: string
  child: string
}

interface ChildGroup {
  name: string
  sites: Site[]
}

interface ParentGroup {
  parent: string
  loose: Site[]
  children: ChildGroup[]
}

interface BookmarkFile {
  bookmarksYaml?: string
  categoryParentOrder?: string[]
  categoryTreeOverride?: Record<string, string[]>
}

const loading = ref(true)
const error = ref('')
const bookmarkFile = ref<BookmarkFile | null>(null)
const sites = ref<Site[]>([])
const pinnedUrls = ref<string[]>([])
const broken = ref<Record<string, boolean>>({})

const pinnedSet = computed(() => new Set(pinnedUrls.value))

const pinnedSites = computed(() => {
  const byUrl = new Map(sites.value.map((site) => [site.url, site]))
  return pinnedUrls.value.flatMap((url) => {
    const site = byUrl.get(url)
    return site ? [site] : []
  })
})

const groups = computed(() => {
  if (!bookmarkFile.value) return []
  const pinned = pinnedSet.value
  return groupSites(bookmarkFile.value, sites.value.filter((site) => !pinned.has(site.url)))
})

function unquote (raw: string) {
  const text = raw.trim()
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return text
}

function parseSites (yaml: string): Site[] {
  const sites: Site[] = []
  let current: Site | null = null
  for (const line of yaml.split(/\r?\n/)) {
    const name = line.match(/^ {2}- name:\s*(.*)$/)
    if (name) {
      if (current?.url) sites.push(current)
      current = { name: unquote(name[1]), url: '', description: '', icon: '', parent: '', child: '' }
      continue
    }
    if (!current) continue
    const field = line.match(/^ {4}(url|description|icon):\s*(.*)$/)
    if (field) {
      current[field[1]] = unquote(field[2])
      continue
    }
    const category = line.match(/^ {6}(parent|child):\s*(.*)$/)
    if (category) current[category[1]] = unquote(category[2])
  }
  if (current?.url) sites.push(current)
  return sites
}

function isNumericHost (url: string) {
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    host = url
  }
  return /^(\d{1,3}\.){1,3}\d{1,3}$/.test(host)
}

function isVisible (site: Site) {
  if (site.parent === '公司内部') return false
  return !isNumericHost(site.url)
}

function groupSites (file: BookmarkFile, sites: Site[]): ParentGroup[] {
  const order = file.categoryParentOrder || []
  const tree = file.categoryTreeOverride || {}
  const byParent = new Map<string, Site[]>()
  for (const site of sites) {
    const parent = site.parent || '其他'
    const list = byParent.get(parent) || []
    list.push(site)
    byParent.set(parent, list)
  }
  const parents = [...order.filter((name) => byParent.has(name))]
  for (const name of byParent.keys()) {
    if (!parents.includes(name)) parents.push(name)
  }
  return parents.map((parent) => {
    const list = byParent.get(parent) || []
    const childOrder = tree[parent] || []
    const loose = list.filter((site) => !site.child)
    const childNames = childOrder.filter((name) => list.some((site) => site.child === name))
    for (const site of list) {
      if (site.child && !childNames.includes(site.child)) childNames.push(site.child)
    }
    return {
      parent,
      loose,
      children: childNames.map((name) => ({
        name,
        sites: list.filter((site) => site.child === name)
      }))
    }
  })
}

function loadPins () {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    const list = raw ? JSON.parse(raw) : []
    pinnedUrls.value = Array.isArray(list) ? list.filter((url) => typeof url === 'string') : []
  } catch {
    pinnedUrls.value = []
  }
}

function togglePin (url: string) {
  const next = pinnedUrls.value.filter((item) => item !== url)
  if (next.length === pinnedUrls.value.length) next.unshift(url)
  pinnedUrls.value = next
  localStorage.setItem(PIN_KEY, JSON.stringify(next))
}

async function load () {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${GIST_URL}?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) throw new Error(String(response.status))
    const file = await response.json() as BookmarkFile
    const next = parseSites(file.bookmarksYaml || '').filter(isVisible)
    if (!next.length) throw new Error('empty')
    bookmarkFile.value = file
    sites.value = next
  } catch {
    error.value = '收藏暂时读不出来'
    bookmarkFile.value = null
    sites.value = []
  } finally {
    loading.value = false
  }
}

function markBroken (url: string) {
  broken.value = { ...broken.value, [url]: true }
}

onMounted(() => {
  loadPins()
  load()
})
</script>

<template>
  <p class="meta">
    <template v-if="loading">正在读取收藏…</template>
    <template v-else-if="error">
      {{ error }}。可以到
      <a :href="GIST_PAGE" target="_blank" rel="noreferrer">GitHub Gist</a>
      查看。
    </template>
    <template v-else>随手存下的网址，按分类列在这里。</template>
  </p>

  <section v-if="pinnedSites.length" class="group">
    <h2 id="置顶">置顶</h2>
    <div class="sites">
      <div v-for="site in pinnedSites" :key="site.url" class="site">
        <a class="site-link" :href="site.url" target="_blank" rel="noreferrer">
          <img v-if="site.icon && !broken[site.url]" :src="site.icon" alt="" @error="markBroken(site.url)">
          <span v-else class="mark" aria-hidden="true" />
          <span class="name">{{ site.name }}</span>
        </a>
        <button type="button" class="pin on" title="取消置顶" aria-label="取消置顶" @click="togglePin(site.url)">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
        </button>
      </div>
    </div>
  </section>

  <section v-for="group in groups" :key="group.parent" class="group">
    <h2 :id="group.parent">{{ group.parent }}</h2>
    <div v-if="group.loose.length" class="sites">
      <div v-for="site in group.loose" :key="site.url" class="site">
        <a class="site-link" :href="site.url" target="_blank" rel="noreferrer">
          <img v-if="site.icon && !broken[site.url]" :src="site.icon" alt="" @error="markBroken(site.url)">
          <span v-else class="mark" aria-hidden="true" />
          <span class="name">{{ site.name }}</span>
        </a>
        <button type="button" class="pin" title="置顶" aria-label="置顶" @click="togglePin(site.url)">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
        </button>
      </div>
    </div>
    <div v-for="child in group.children" :key="child.name" class="child">
      <p class="child-title">{{ child.name }}</p>
      <div class="sites">
        <div v-for="site in child.sites" :key="site.url" class="site">
          <a class="site-link" :href="site.url" target="_blank" rel="noreferrer">
            <img v-if="site.icon && !broken[site.url]" :src="site.icon" alt="" @error="markBroken(site.url)">
            <span v-else class="mark" aria-hidden="true" />
            <span class="name">{{ site.name }}</span>
          </a>
          <button type="button" class="pin" title="置顶" aria-label="置顶" @click="togglePin(site.url)">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.meta {
  margin: 0 0 1.75rem;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.group + .group {
  margin-top: 1.75rem;
}

.group h2 {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.child-title {
  margin: 1rem 0 0.4rem;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
}

.sites {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.site {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px 2px 8px;
  margin: 0 -8px;
  border-radius: 6px;
}

.site:hover {
  background: var(--vp-c-bg-soft);
}

.site-link {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  padding: 3px 0;
  color: var(--vp-c-text-1);
  font-size: 15px;
  line-height: 1.45;
  text-decoration: none;
}

.site:hover .name {
  color: var(--vp-c-brand-1);
}

.pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
}

.pin svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.site:hover .pin,
.site:focus-within .pin,
.pin.on {
  opacity: 1;
  pointer-events: auto;
}

.pin:hover,
.pin.on {
  color: var(--vp-c-brand-1);
}

.site img,
.mark {
  width: 16px;
  height: 16px;
  flex: none;
  border-radius: 3px;
  object-fit: contain;
}

.mark {
  background: var(--vp-c-bg-soft);
}

.name {
  min-width: 0;
}
</style>
