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

onMounted(loadStars)
</script>

<template>
  <div class="site-stats" aria-label="站点统计">
    <a
      class="stat visit"
      href="https://zqdejob.github.io/"
      title="本站访问量"
    >
      <img
        class="visit-img"
        src="https://visitor-badge.laobi.icu/badge?page_id=zqDeJob.github.io&left_text=%E8%AE%BF%E9%97%AE"
        alt="访问量"
      >
    </a>
    <a
      class="stat star"
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
  gap: 0.5rem;
  margin-right: 0.75rem;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  text-decoration: none;
  color: var(--vp-c-text-2);
  transition: color 0.2s, border-color 0.2s, opacity 0.2s;
}

.stat.visit {
  line-height: 0;
}

.visit-img {
  height: 20px;
  display: block;
}

.stat.star {
  padding: 0.28rem 0.55rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}

.stat.star:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.label {
  opacity: 0.8;
}

.value {
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 768px) {
  .site-stats {
    margin-right: 0.35rem;
    gap: 0.35rem;
  }

  .visit-img {
    height: 18px;
  }

  .stat.star {
    padding: 0.22rem 0.45rem;
  }
}
</style>
