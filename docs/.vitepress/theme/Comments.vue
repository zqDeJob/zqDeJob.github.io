<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const route = useRoute()
const { frontmatter, isDark } = useData()

function themeName () {
  return isDark.value ? 'photon-dark' : 'github-light'
}

async function mountComments () {
  await nextTick()
  const slot = document.getElementById('comment')
  if (!slot) return
  slot.innerHTML = ''
  if (frontmatter.value.comments !== true) return

  const script = document.createElement('script')
  script.src = 'https://utteranc.es/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('repo', 'zqDeJob/zqDeJob.github.io')
  script.setAttribute('issue-term', 'pathname')
  script.setAttribute('theme', themeName())
  script.setAttribute('label', 'comment')
  slot.appendChild(script)
}

onMounted(mountComments)
watch(() => route.path, mountComments)
watch(isDark, (dark) => {
  const frame = document.querySelector<HTMLIFrameElement>('iframe.utterances-frame')
  frame?.contentWindow?.postMessage(
    { type: 'set-theme', theme: dark ? 'photon-dark' : 'github-light' },
    'https://utteranc.es'
  )
})
</script>

<template>
  <div id="comment" class="vp-comments" />
</template>

<style scoped>
.vp-comments {
  margin-top: 1.5rem;
}
</style>
