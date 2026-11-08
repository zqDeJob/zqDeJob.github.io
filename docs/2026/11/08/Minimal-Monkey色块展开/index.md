---
title: Minimal Monkey 色块展开
date: 2026-11-08 19:40:00
category: 研发二三事
comments: true
---

# Minimal Monkey 色块展开

[minimalmonkey.com](http://minimalmonkey.com/) 首页是一排彩色文章列。鼠标放上去，当前列变宽、摘要变清楚，紧挨着的两列被压窄，其余列变暗。点进去时颜色会跟着文章走，地址换了，整页并不刷新。

源码作者 Stephen Burgess 写在页面注释里，仓库是 [minimalmonkey/minimalmonkey.github.io](https://github.com/minimalmonkey/minimalmonkey.github.io)。下面按现在这份源码说。早年的笔记在 [一个挺好看的分类展示效果](https://blog.csdn.net/qq_37026254/article/details/95463518)。

## 技术栈

| 层 | 用的东西 |
| --- | --- |
| 页面 | Jekyll，文章是 Markdown，首页色块由 Liquid 循环生成 |
| 样式 | Sass，Gulp 编成 `css/style.built.css` |
| 脚本 | 浏览器原生 JS，CommonJS 模块，Browserify 打成 `js/main.built.js` |
| 换页 | 自己写的 `Router`，链接上有 `data-router` |
| 动效 | `transform` 和 `opacity` 的 CSS transition，时长 0.35s |

构建依赖里有 gulp、gulp-ruby-sass、browserify、mathsass。交互没有 jQuery，也没有 Backbone。

## 一列长什么样

每一列是一个带颜色 class 的链接，正文放在 `.panel-content` 里。

```html
<div id="panels" class="panels">
  <a class="panel color-navy" href="/dynamic-bezel-lines-experiment/" data-color="navy" data-router>
    <div class="panel-content">
      <span class="panel-date">14 May 2013</span>
      <h1 class="panel-headline">Dynamic Bezel Lines</h1>
      <p class="panel-summary">Dynamically created bezel lines experiment.</p>
      <div class="panel-read"><span class="panel-read-text">Read article</span></div>
    </div>
  </a>
</div>
```

横屏时 `.panels` 是 `display: flex`，每列固定 `320px`，整排放得下就横向排，放不下就跟着页面横向滚动。滚到尽头会再请求下一页色块，接在后面。

## 变宽靠缩放，不改布局宽度

列本身的宽度动画很少动。真正撑出去的是左右各半块色板，用 `scaleX` 往外侧长。

源码里的两个数：

```scss
$panel-width: 320px;
$panel-expand-scale: 50 / 320; // 0.15625，每侧大约多出 25px，两侧合计 50px
```

悬停列的色板：

```scss
.panel-content:before,
.panel-content:after {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background-color: inherit;
  transform: scaleX(1);
  transition: transform 0.35s;
}

.is-expanded .panel-content:before,
.is-expanded .panel-content:after {
  transform: scaleX(1.15625);
}
```

`:before` 贴左边，变换原点在右边缘；`:after` 贴右边，原点在左边缘。这样放大时颜色是从中缝往两边铺，字还留在原来的 320px 里，不会跟着色块一起被拉变形。

旁边那一列用相反的比例缩回去：

```scss
.is-shrunk-left .panel-content:after,
.is-shrunk-right .panel-content:before {
  transform: scaleX(0.84375); // 1 - 50/320
}
```

只缩靠近悬停列的那一半。远的那一半不动，看起来就是被挤进去一截。

`1.15625` 就是 `1 + 50/320`。旧笔记里写的 `scaleX(1.15625)` 和这个数一致。

## 变暗是一层黑遮罩

整排进入悬停时，容器加上 `is-hovered`。每一列左右两半再盖一层 `rgba(0, 0, 0, 0.55)`，用透明度淡入。当前列带上 `is-expanded` 后，它自己的这层遮罩透明度回到 0，所以只有它保持原色，其余列都压暗。

摘要默认 `opacity: 0.5`，展开的那一列回到 `1`。

字和日期的 `z-index` 高于色板和遮罩，放大、压暗时文字还在最上面。

## 脚本只负责换 class

`Panels.js` 在每列上听 `mouseover`。进到新的一列，先清掉上一列的状态，再给当前列、左边邻居、右边邻居分别加上三个 class。

```js
function addExpandClass (panels, index) {
  panels[index].classList.add('is-expanded')
  if (index > 0) panels[index - 1].classList.add('is-shrunk-left')
  if (index < panels.length - 1) panels[index + 1].classList.add('is-shrunk-right')
}
```

鼠标离开整排时，去掉 `is-hovered`，并清掉这三个 class。宽度、颜色、透明度都在 CSS 里过渡，JS 不改 style。

## 进场和点进文章

第一次进来，横屏下列先 `translateY(100%)` 躲在下面，再加上过渡后一条条顶上来。第 2 列开始，每列多 0.05s 延迟。

点某一列时不整页跳转。链接上的 `data-router` 交给自己的路由：给 `body` 加上 `is-transition-topostfrompanels`，用这一列的 `data-color` 把页面底色设成同一种颜色，邻居再让出大约 25px（展开量的一半，源码注释里写了这个数），过渡结束后才把文章内容换上。

## 页面里试一下

下面这段是按同样的节奏做的简化版：悬停变宽、其余压暗、摘要变清楚。为了能放进文章栏，变宽用了 `flex-grow`。原站是固定 320px 列宽，再用上面的 `scaleX` 把颜色铺出去。

<PanelHoverDemo />
