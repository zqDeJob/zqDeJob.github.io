# zqDeJob避风塘 ~

基于 [VitePress](https://vitepress.dev/) 的个人笔记，部署在 GitHub Pages。左侧是章节目录，中间是正文，右侧是本页大纲。

- 线上地址：<https://zqdejob.github.io>
- 主题文档：<https://vitepress.dev/zh/>

## 环境要求

- [Node.js](https://nodejs.org/) 18+（推荐 20 或 22）
- [pnpm](https://pnpm.io/)

## 快速开始

```bash
pnpm install
pnpm dev
```

浏览器打开终端里提示的本地地址。结束预览时在终端按 `Ctrl+C`。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 生成本地版本页并启动预览 |
| `pnpm run build` | 生成静态站点到 `docs/.vitepress/dist/` |
| `pnpm run preview` | 预览构建结果 |
| `pnpm run version:sync` | 只根据 git log 刷新 `docs/version/index.md` |

## 写一篇笔记

按日期新建 `docs/年/月/日/标题/index.md`：

```yaml
---
title: 我的笔记
date: 2026-11-07 12:00:00
category: 研发二三事
comments: true
---
```

`category` 用 `研发二三事`、`AI` 或 `生活乐子`。侧栏按 `date` 从早到晚排列。文章里的图片放在 `docs/public/img/`，用 `/img/...` 引用。

已发布文章的地址仍是 `/年/月/日/标题/`，和原来的永久链接一致。

## 其他页面

- **版本**（`/version/`）：构建前由 `scripts/sync-version.js` 根据 `git log` 生成，记录最近 10 条提交。
- **评论**：文章 front matter 里 `comments: true` 时，页底加载 [Utterances](https://utteranc.es/)（仓库 `zqDeJob/zqDeJob.github.io`）。

## 项目结构

```
zqDeJob.github.io/
├── docs/                      # 站点内容
│   ├── .vitepress/config.mts  # 导航、搜索、侧栏
│   ├── index.md               # 首页
│   ├── 2026/.../index.md      # 笔记（路径即网址）
│   ├── version/               # 版本页（构建时生成）
│   └── public/                # 图片
├── scripts/sync-version.js
├── .github/workflows/deploy.yml
└── package.json
```

不要提交 `node_modules/` 和 `docs/.vitepress/dist/`。

若安装时提示 `esbuild` 的构建脚本被忽略：pnpm 10 看根目录 `.npmrc` 的 `only-built-dependencies[]=esbuild`，pnpm 11 看 `pnpm-workspace.yaml` 的 `allowBuilds.esbuild`。删掉 `node_modules` 后重新 `pnpm install`。

## 部署

推送到 `main` 或 `master` 后，GitHub Actions 会执行 `pnpm run build` 并发布到 GitHub Pages。

仓库 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**。
