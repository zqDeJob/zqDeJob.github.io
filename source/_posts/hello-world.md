---
title: Hello World
date: 2026-05-21 10:00:00
categories:
  - 研发二三事
tags:
  - Hexo
  - Butterfly
  - 入门
---

欢迎来到 [Hexo](https://hexo.io/)！这是你的第一篇文章。更多说明请查看 [官方文档](https://hexo.io/docs/)。使用 Hexo 时若遇到问题，可在 [故障排查](https://hexo.io/docs/troubleshooting.html) 中查找答案，或在 [GitHub](https://github.com/hexojs/hexo/issues) 上提问。

## 快速开始

### 创建新文章

```bash
hexo new "我的新文章"
```

更多信息：[写作](https://hexo.io/docs/writing.html)

### 启动本地服务

```bash
hexo server
```

更多信息：[本地服务器](https://hexo.io/docs/server.html)

### 生成静态文件

```bash
hexo generate
```

更多信息：[生成](https://hexo.io/docs/generating.html)

### 部署到远程站点

```bash
hexo deploy
```

更多信息：[部署](https://hexo.io/docs/deployment.html)

---

## 如何发布一篇新文章

### 方式一：用命令创建（推荐）

在项目根目录执行（本项目使用 pnpm）：

```bash
pnpm exec hexo new "我的文章标题"
```

会在 `source/_posts/` 下生成带日期的文件，例如 `2026-05-21-我的文章标题.md`。

### 方式二：手动新建文件

在 `source/_posts/` 目录中新建 `.md` 文件，**开头必须包含 Front Matter**（YAML 头）：

```markdown
---
title: 我的第一篇技术笔记
date: 2026-05-21 10:00:00
updated: 2026-05-21 12:00:00
categories:
  - 技术
tags:
  - Hexo
  - Butterfly
---

正文从这里开始写……
```

### 写完以后

| 步骤 | 命令 | 作用 |
|------|------|------|
| 本地预览 | `pnpm exec hexo server` | 在浏览器查看效果 |
| 生成静态站 | `pnpm exec hexo generate` | 输出到 `public/` 目录 |
| 上线 | 将 `public/` 部署到 GitHub Pages 等 | 访客才能访问 |

只修改 Markdown 而不执行 `generate`，线上站点不会更新。

---

## 本站分类

本站已定义三个分类，发文章时在 Front Matter 里选择其一即可：

| 分类 | 用途 |
|------|------|
| **AI** | AI 学习、工具与实践 |
| **生活乐子** | 生活趣事、见闻与碎碎念 |
| **研发二三事** | 开发、技术笔记与博客搭建 |

```yaml
categories:
  - AI          # 或：生活乐子 / 研发二三事
```

---

## 分类与标签是怎么回事

在 Hexo 里，**分类（categories）** 和 **标签（tags）** 是两套不同的归类方式：

| | 分类 `categories` | 标签 `tags` |
|---|------------------|-------------|
| 用途 | 文章属于哪个「栏目」 | 给文章打多个关键词 |
| 结构 | 可层级，如 `技术/前端` | 扁平，一篇可挂多个 |
| 对应页面 | `/categories/` | `/tags/` |
| 常见习惯 | 每篇通常 1 个主分类 | 一篇可有很多标签 |

站点配置（`_config.yml`）中相关项：

- **`default_category: uncategorized`**：文章未写 `categories` 时，归入默认分类「未分类」。
- **`category_map` / `tag_map`**：可将 Front Matter 中的名称映射为别的显示名或 URL。

### 示例

```yaml
categories:
  - 生活
tags:
  - 读书
  - 随笔
```

- 侧边栏、归档页会出现「生活」分类入口。
- 「读书」「随笔」会出现在标签云或标签页。

层级分类写法：

```yaml
categories:
  - 技术
  - 技术/前端   # 「技术」下的「前端」子分类
```

### 与 Butterfly 主题的关系

[Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) 负责**如何展示**分类与标签（侧边栏卡片、分类页 banner 等），在 `_config.butterfly.yml` 中可开关。  
**数据来自每篇文章的 Front Matter**，不是主题自动生成的。

---

## 最短流程小结

1. `pnpm exec hexo new "标题"`，或在 `source/_posts/` 手动新建 `.md`
2. 在文件头写好 `title`、`date`，按需添加 `categories`、`tags`
3. 撰写正文（Markdown）
4. `pnpm exec hexo server` 本地预览
5. 满意后执行 `pnpm exec hexo generate`，再部署 `public/` 目录
