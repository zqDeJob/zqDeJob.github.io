<script setup lang="ts">
import { onMounted } from 'vue'

function loadVisits () {
  document.getElementById('vercount-script')?.remove()
  const script = document.createElement('script')
  script.id = 'vercount-script'
  script.defer = true
  script.src = 'https://cn.vercount.one/js'
  document.body.appendChild(script)
}

onMounted(loadVisits)
</script>

<template>
  <div class="site-stats" aria-label="站点统计">
    <span class="stat" title="本站访客数，同一浏览器只计一次">
      <span class="label">访客</span>
      <span id="vercount_value_site_uv" class="value" v-once>…</span>
    </span>
  </div>
</template>

<style scoped>
.site-stats {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
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
  }

  .stat {
    padding: 5px 10px;
  }
}
</style>
