# zqDeJob避风塘 ~

基于 [Hexo](https://hexo.io/) + [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) 的个人博客，部署在 GitHub Pages。

- 线上地址：<https://zqdejob.github.io>
- 主题文档：<https://butterfly.js.org/zh-CN/docs/>

## 环境要求

- [Node.js](https://nodejs.org/) 18+（推荐 20 或 22）
- [pnpm](https://pnpm.io/)（本项目使用 pnpm 管理依赖）

## 快速开始

```bash
# 克隆仓库后进入项目目录
cd zqDeJob.github.io

# 安装依赖
pnpm install

# 本地预览（默认 http://localhost:4000）
pnpm run server

# 若 4000 端口被占用，可换端口
pnpm exec hexo server -p 4001
```

浏览器打开 <http://localhost:4000> 查看效果。结束预览时在终端按 `Ctrl+C`。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm run server` | 启动本地开发服务器 |
| `pnpm run build` | 生成静态站点到 `public/`（本地预览用，勿提交 Git） |
| `pnpm run clean` | 清除 `public/` 与缓存 `db.json` |
| `pnpm exec hexo new "文章标题"` | 在 `source/_posts/` 新建文章 |

也可使用 `pnpm exec hexo <命令>`，与上表等价。

## 项目结构

```
zqDeJob.github.io/
├── source/                 # 站点内容
│   ├── _posts/             # 博客文章（Markdown）
│   └── img/                # 图片资源（如首页壁纸）
├── _config.yml             # Hexo 主配置（标题、URL、分类映射等）
├── _config.butterfly.yml   # Butterfly 主题配置（菜单、壁纸、副标题等）
├── .github/workflows/      # GitHub Actions 自动构建部署
├── package.json
└── pnpm-lock.yaml
```

**不要提交** `node_modules/`、`public/`、`db.json`（已在 `.gitignore` 中忽略）。

## 写文章

```bash
pnpm exec hexo new "我的文章标题"
```

在 `source/_posts/` 对应文件的 Front Matter 中设置分类，例如：

```yaml
categories:
  - AI          # 或：生活乐子 / 研发二三事
```

### 文章封面（自动配图）

未写 `cover` 的文章会由 `scripts/auto-cover.js` 按 **分类 + 标题 slug** 从 [Picsum](https://picsum.photos/) 取稳定配图（每篇不同，重建不变）。

在 `_config.yml` 的 `auto_cover` 可开关或改尺寸。若某篇不要封面：

```yaml
cover: false
```

若要**下载到本地**（加载更快、不依赖外网）：

```bash
pnpm run covers:fetch
```

然后把 `_config.yml` 里 `auto_cover.provider` 改为 `local`。

一次性把 `cover` 写入各文章 Front Matter（可选）：

```bash
pnpm run covers:sync
```

手动指定封面仍可在 Front Matter 写 `cover: /img/xxx.jpg` 或外链。

### 主页与分类顶图

在 `_config.yml` 的 `site_images` 中配置（默认使用 `/img/home-page.png`），构建时由 `scripts/site-images.js` 同步到 Butterfly，无需改 `_config.butterfly.yml` 里的 `index_img`。

## 部署

推送到 `main` / `master` 分支后，[GitHub Actions](.github/workflows/deploy.yml) 会自动执行 `hexo generate` 并发布到 GitHub Pages。

1. 仓库 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**
2. `git push` 后可在 **Actions** 页查看构建状态

本地无需执行 `hexo deploy`，也无需把 `public/` 推送到仓库。

## 配置说明

| 文件 | 用途 |
|------|------|
| `_config.yml` | 站点名称、作者、`url`、permalink、分类映射、`site_images`（主页图 home-page 等）、`auto_cover` |
| `_config.butterfly.yml` | 导航、打字副标题、侧边栏、主题样式（顶图由 `site_images` 同步） |

修改配置后，本地需重启 `pnpm run server` 或重新 `pnpm run build` 才能看到变化。

## 使用 npm 时（可选）

若未安装 pnpm，可先 `npm install -g pnpm`，或尝试：

```bash
npm install
npx hexo server
```

推荐使用 pnpm，与 CI 环境一致，避免依赖解析问题。

## 参考链接

- [Hexo 文档](https://hexo.io/docs/)
- [Butterfly 中文文档](https://butterfly.js.org/zh-CN/docs/)
- [Hexo GitHub Pages 部署](https://hexo.io/docs/github-pages.html)
