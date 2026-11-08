<script setup lang="ts">
const posts = [
  {
    color: '#6b4c9a',
    date: '3 Jul 2014',
    title: 'Hello World',
    summary: '隔了一年再写一篇，算是打个招呼。'
  },
  {
    color: '#e07a2f',
    date: '22 May 2013',
    title: '搬到旧金山',
    summary: '在纽约待了十五个月，往西走到技术更集中的地方。'
  },
  {
    color: '#16528e',
    date: '14 May 2013',
    title: '动态边框线',
    summary: '用透明图或文字生成一圈线，跟着内容走。'
  },
  {
    color: '#e54b4b',
    date: '2 May 2013',
    title: '过渡和旧浏览器',
    summary: 'CSS 过渡很好用，旧浏览器要单独留一条退路。'
  }
]
</script>

<template>
  <div class="mm-demo" aria-label="色块悬停演示">
    <div
      v-for="post in posts"
      :key="post.title"
      class="col"
      :style="{ background: post.color }"
    >
      <span class="shade" aria-hidden="true" />
      <div class="body">
        <span class="date">{{ post.date }}</span>
        <strong class="title">{{ post.title }}</strong>
        <p class="summary">{{ post.summary }}</p>
      </div>
    </div>
  </div>
  <p class="hint">把鼠标移到某一列上。这一列变宽，摘要变清楚，其余列压暗。</p>
</template>

<style scoped>
.mm-demo {
  display: flex;
  height: 240px;
  overflow: hidden;
  border-radius: 8px;
}

.col {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  color: #fff;
  overflow: hidden;
  transition: flex-grow 0.35s ease;
}

.mm-demo:hover .col {
  flex-grow: 0.72;
}

.mm-demo:hover .col:hover {
  flex-grow: 1.55;
}

.shade {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.35s ease;
}

.mm-demo:hover .shade {
  opacity: 1;
}

.col:hover .shade {
  opacity: 0;
}

.body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 18px;
}

.date {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
}

.title {
  margin-top: 16px;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 600;
}

.summary {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.45;
  transition: opacity 0.35s ease;
}

.col:hover .summary {
  opacity: 1;
}

.hint {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
