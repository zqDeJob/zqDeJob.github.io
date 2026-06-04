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
    {% for project in site.data.demo.projects %}
    <article class="demo-card" data-type="{{ project.type }}">
      <div class="card-content">
        <h3 class="card-title">{{ project.title }}</h3>
        <p class="card-desc">{{ project.description }}</p>
        <div class="card-tags">
          {% for tag in project.tags %}
          <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
      </div>
      <div class="card-actions">
        {% if project.type == 'html' %}
        <a href="{{ project.path }}" class="btn btn-primary" target="_blank">
          <i class="fas fa-external-link-alt"></i> 预览
        </a>
        {% elif project.type == 'url' %}
        <a href="{{ project.url }}" class="btn btn-primary" target="_blank" rel="noopener">
          <i class="fas fa-external-link-alt"></i> 访问
        </a>
        {% elif project.type == 'article' %}
        <a href="/{{ project.post_slug }}/" class="btn btn-primary">
          <i class="fas fa-file-text"></i> 阅读
        </a>
        {% endif %}
      </div>
      <div class="card-badge" data-type="{{ project.type }}">
        {% if project.type == 'html' %}HTML{% elif project.type == 'url' %}URL{% else %}Article{% endif %}
      </div>
    </article>
    {% endfor %}
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