---
title: Demo 展示
date: 2024-01-01 00:00:00
type: "demo"
---

<div id="demo-container">
  <div class="demo-header">
    <h1>🎨 Demo 展示</h1>
    <p>个人项目、工具集和精彩片段</p>
  </div>
  
  <div class="demo-filters">
    <button class="filter-btn active" data-filter="all">全部</button>
    <button class="filter-btn" data-filter="html">自定义 HTML</button>
    <button class="filter-btn" data-filter="url">外部链接</button>
    <button class="filter-btn" data-filter="article">文章片段</button>
  </div>
  
  <div class="demo-grid" id="demo-grid">
    <article class="demo-card" data-type="html">
      <div class="card-content">
        <h3 class="card-title">图片 Base64 转换器</h3>
        <p class="card-desc">图片与 Base64 互转工具，支持粘贴、拖拽、复制和下载。</p>
        <div class="card-tags">
          <span class="tag">工具</span>
          <span class="tag">Base64</span>
          <span class="tag">图片</span>
        </div>
      </div>
      <div class="card-actions">
        <a href="/demo/base64.html" class="btn btn-primary" target="_blank">
          <i class="fas fa-external-link-alt"></i> 预览
        </a>
      </div>
      <div class="card-badge" data-type="html">HTML</div>
    </article>

    <article class="demo-card" data-type="url">
      <div class="card-content">
        <h3 class="card-title">GitHub 仓库</h3>
        <p class="card-desc">我的 GitHub 代码仓库。</p>
        <div class="card-tags">
          <span class="tag">GitHub</span>
          <span class="tag">Code</span>
        </div>
      </div>
      <div class="card-actions">
        <a href="https://github.com/zqDeJob" class="btn btn-primary" target="_blank" rel="noopener">
          <i class="fas fa-external-link-alt"></i> 访问
        </a>
      </div>
      <div class="card-badge" data-type="url">URL</div>
    </article>

    <article class="demo-card" data-type="url">
      <div class="card-content">
        <h3 class="card-title">Hexo 官方文档</h3>
        <p class="card-desc">Hexo 静态博客框架官方文档。</p>
        <div class="card-tags">
          <span class="tag">Documentation</span>
          <span class="tag">Hexo</span>
        </div>
      </div>
      <div class="card-actions">
        <a href="https://hexo.io/docs/" class="btn btn-primary" target="_blank" rel="noopener">
          <i class="fas fa-external-link-alt"></i> 访问
        </a>
      </div>
      <div class="card-badge" data-type="url">URL</div>
    </article>

    <article class="demo-card" data-type="article">
      <div class="card-content">
        <h3 class="card-title">快速开始指南</h3>
        <p class="card-desc">开发环境搭建与工具链配置指南。</p>
        <div class="card-tags">
          <span class="tag">Guide</span>
          <span class="tag">Dev</span>
        </div>
      </div>
      <div class="card-actions">
        <a href="/2026/05/21/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B-%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83%E4%B8%8E%E5%B7%A5%E5%85%B7%E9%93%BE/" class="btn btn-primary">
          <i class="fas fa-file-text"></i> 阅读
        </a>
      </div>
      <div class="card-badge" data-type="article">Article</div>
    </article>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.demo-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.type === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
</script>
