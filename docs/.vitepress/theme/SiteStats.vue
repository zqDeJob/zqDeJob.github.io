<script setup lang="ts">
import { onMounted, ref } from 'vue'

const stars = ref<number | null>(null)

async function loadStars () {
  try {
    const res = await fetch('https://api.github.com/repos/zqDeJob/zqDeJob.github.io')
    if (!res.ok) return
    const data = await res.json()
    stars.value = typeof data.stargazers_count === 'number' ? data.stargazers_count : 0
  } catch {
    // 网络不通时保持占位
  }
}

function loadVisits () {
  document.getElementById('vercount-script')?.remove()
  const script = document.createElement('script')
  script.id = 'vercount-script'
  script.defer = true
  script.src = 'https://cn.vercount.one/js'
  document.body.appendChild(script)
}

onMounted(() => {
  loadStars()
  loadVisits()
})
</script>

<template>
  <div class="site-stats" aria-label="站点统计">
    <span class="stat" title="本站总访问量">
      <span class="label">访问</span>
      <span id="vercount_value_site_pv" class="value" v-once>…</span>
    </span>
    <a
      class="stat"
      href="https://github.com/zqDeJob/zqDeJob.github.io"
      target="_blank"
      rel="noreferrer"
      title="GitHub Stars"
    >
      <span class="label">Stars</span>
      <span class="value">{{ stars === null ? '…' : stars }}</span>
    </a>
  </div>
</template>

<style scoped>
.site-stats {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
  margin-right: 14px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s, border-color 0.2s;
}

a.stat:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.label {
  opacity: 0.85;
}

.value {
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  min-width: 1em;
}

@media (max-width: 768px) {
  .site-stats {
    margin-right: 8px;
    gap: 8px;
  }

  .stat {
    padding: 5px 10px;
  }
}
</style>
