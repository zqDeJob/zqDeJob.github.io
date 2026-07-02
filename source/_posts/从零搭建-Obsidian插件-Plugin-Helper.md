---
title: 从零搭建 Obsidian 插件：以 Plugin Helper 为例
date: 2026-07-02 18:00:00
categories:
  - 研发二三事
tags:
  - Obsidian
  - 插件开发
  - TypeScript
  - 开源
---
cover: /img/covers/从零搭建-Obsidian插件-Plugin-Helper.jpg

## 为什么要做这个插件

我 Obsidian 里装了不少社区插件，英文也看得懂，但**时间一长就忘了每个插件到底是干什么的**。

设置里虽然能点进单个插件看说明，可要一个个翻、英文原文又长，查起来很麻烦。尤其插件一多，经常只记得装过、不记得用来干嘛，有些甚至忘了自己有没有在用。

所以干脆 **DIY 了一个小插件**：[Plugin Helper](https://github.com/zqDeJob/obsidian-plugin-helper)。它把已安装的社区插件列在一起，拉取官方英文说明，自动附上中文注释，侧边栏还能写自己的备注。装了很多插件、隔一阵不用就忘功能的人，应该能感同身受。

本地用着没问题之后，我又想上架社区市场，让更多人用——后面踩的坑，都整理在文末。

---

## 一、从 0 开始：搭架子

### 1. 技术栈

Obsidian 插件本质是：**TypeScript 源码 → esbuild 打包 → 产出 `main.js`**，由 Obsidian 在运行时加载。

| 文件 | 作用 |
|------|------|
| `src/main.ts` | 插件入口，继承 `Plugin` |
| `esbuild.config.mjs` | 打包配置 |
| `manifest.json` | 插件元数据（Obsidian 必读） |
| `styles.css` | 样式（可选） |
| `versions.json` | 版本与最低 Obsidian 版本映射（上架必需） |

也可以从官方 [sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin) 克隆改，思路一样。

### 2. 初始化

```bash
npm install
npm run dev    # 监听构建，改代码自动重编
npm run build  # 生产构建，产出 main.js
```

`esbuild.config.mjs` 里要把 `obsidian`、`electron`、CodeMirror 等标为 `external`——这些是 Obsidian 运行时自带的，不能打进 bundle。

### 3. 最小 `manifest.json`

```json
{
  "id": "plugin-helper",
  "name": "Plugin Helper",
  "version": "1.0.1",
  "minAppVersion": "1.5.0",
  "description": "Browse installed community plugins with official descriptions...",
  "author": "zqDeJob",
  "authorUrl": "https://github.com/zqDeJob",
  "isDesktopOnly": false
}
```

### 4. 插件入口

核心就是继承 `Plugin`，在 `onload` 里注册视图、命令、设置页：

```typescript
export default class PluginHelperPlugin extends Plugin {
  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_PLUGIN_CATALOG, (leaf) => new PluginCatalogView(leaf, this));
    this.addRibbonIcon("book-open", "插件说明书", () => { /* ... */ });
    this.addCommand({ id: "open-plugin-catalog-sidebar", name: "打开插件说明书（侧边栏）", /* ... */ });
    this.addSettingTab(new PluginHelperSettingTab(this.app, this));
  }
}
```

命令名、侧边栏标题、设置页文案都可以是中文；这和社区市场的 `manifest.name` 是两套东西，后面会讲。

---

## 二、本地调试

1. `npm run dev` 或 `npm run build` 生成 `main.js`
2. 把整个插件目录放到：

   ```
   你的库/.obsidian/plugins/plugin-helper/
   ```

3. **文件夹名必须等于 `manifest.json` 里的 `id`**（这里是 `plugin-helper`）
4. 设置 → 社区插件 → 启用 → 重载 Obsidian

`id` 和文件夹名不一致时，有些 API（比如 `onExternalSettingsChange`）会静默失效，文档里容易漏看。

---

## 三、项目结构

```
plugin-helper/
├── src/
│   ├── main.ts              # 入口
│   ├── PluginCatalogView.ts # 侧边栏视图
│   ├── PluginCatalogModal.ts# 弹窗
│   ├── settings-tab.ts      # 设置页
│   ├── plugin-data.ts       # 读取已安装插件数据
│   ├── community.ts         # 拉取社区插件库 JSON
│   ├── translate.ts         # 翻译逻辑
│   └── ...
├── main.js                  # 构建产物（不要手改）
├── manifest.json
├── styles.css
├── versions.json
├── esbuild.config.mjs
└── package.json
```

`versions.json` 示例：

```json
{
  "1.0.0": "1.5.0",
  "1.0.1": "1.5.0"
}
```

每个发布版本都要加一行，告诉 Obsidian 该版本最低需要哪个 app 版本。

---

## 四、发布 Release

上架前需要在 GitHub 发 Release，附件至少包含：

- `main.js`
- `manifest.json`
- `styles.css`

我用 GitHub Actions 在 push tag 时自动构建发布：

```yaml
on:
  push:
    tags: ["*"]

jobs:
  release:
    steps:
      - run: npm ci
      - run: npm run build
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            main.js
            manifest.json
            styles.css
```

打 tag → 自动 build → 自动挂 Release 附件，省得每次手拷文件。完整配置见仓库 [`.github/workflows/release.yml`](https://github.com/zqDeJob/obsidian-plugin-helper/blob/main/.github/workflows/release.yml)。

---

## 五、提交社区插件市场

流程概要：

1. 仓库里有 `README.md`、`LICENSE`、`manifest.json`
2. 在 GitHub 发带 `main.js` 等附件的 [Release](https://github.com/zqDeJob/obsidian-plugin-helper/releases)
3. 登录 [Obsidian Community 开发者后台](https://obsidian.md/plugins)，连接 GitHub，提交插件；或向 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases) 的 `community-plugins.json` 提 PR

`community-plugins.json` 条目示例：

```json
{
  "id": "plugin-helper",
  "name": "Plugin Helper",
  "author": "zqDeJob",
  "description": "Browse installed community plugins with official descriptions...",
  "repo": "zqDeJob/obsidian-plugin-helper"
}
```

**`id`、`name`、`author`、`description` 必须和 `manifest.json` 一致。**

从 2026 年起，每个新版本还会自动扫描代码质量和安全性，不只是第一次提交时检查。

---

## 六、小结

做这个插件的初衷很简单：**插件装多了、英文说明看久了会忘，想要一个地方集中查每个插件是干什么的**。

从 0 搭 Obsidian 插件本身不难：TypeScript + esbuild + manifest，本地丢进 `.obsidian/plugins/` 就能跑。真正费时间的是上架社区那一套——Release 流程、`versions.json`、manifest 规范，以及下面这些坑。

源码仓库：[zqDeJob/obsidian-plugin-helper](https://github.com/zqDeJob/obsidian-plugin-helper)

---

## 附录：踩坑实录

本地能跑 ≠ 能上架。下面是我实际上碰到的两类问题，以及几个提前知道能省时间的点。

### 坑 1：This name is not allowed in the directory

提交社区目录后，收到这句：

> **This name is not allowed in the directory. Change the name in your manifest.json to follow the manifest naming guidelines and try again.**

#### 我最初写了什么

```json
{
  "id": "plugin-helper",
  "name": "插件说明书",
  "description": "浏览已安装社区插件的官方说明与中文注释..."
}
```

本地完全正常，界面也是中文。校验却失败了。

#### 原因

社区市场的 **`name` 是面向全球用户的展示名**，不是插件内 UI 文案。官方要求：

- 只用 [Basic Latin](https://en.wikipedia.org/wiki/Basic_Latin_(Unicode_block)) 字符，优先英文
- 不能含 Obsidian / Obsi- / -sidian
- 不能与已有插件重名

`插件说明书` 含中文，直接违规。`id` 用 `plugin-helper` 没问题。

#### 怎么改的

```diff
-  "name": "插件说明书",
+  "name": "Plugin Helper",
-  "description": "浏览已安装社区插件..."
+  "description": "Browse installed community plugins with official descriptions..."
```

插件内界面仍然全是中文——ribbon「插件说明书」、命令「打开插件说明书（侧边栏）」都没动。用户在市场搜 **Plugin Helper**，装进去后看到的是中文。

#### 三层「名字」别搞混

| 层级 | 示例 | 要求 |
|------|------|------|
| `manifest.id` | `plugin-helper` | 文件夹名，小写连字符，不含 obsidian |
| `manifest.name` | `Plugin Helper` | 社区展示，必须英文 |
| 插件内 UI | 插件说明书 | 随意，中文没问题 |

---

### 坑 2：The latest release failed automated checks

修完命名后，开发者后台又出现：

> **The latest release of this entry failed one or more automated checks. See the Reviews section below.**

代码本地能跑、Release 也发了，为什么还不行？

#### 这条消息是什么意思

顶部的红字只是总览。**具体原因在下面的 Reviews 区域**，点进去能看到带文件链接的错误列表。

从 2026 年起，**每个 GitHub Release 都会自动扫描**，不只是第一次提交：

- Release 附件是否齐全
- `manifest.json` 的 `version` 是否对应某个 GitHub Release tag
- 源码是否符合 [eslint-plugin-obsidianmd](https://github.com/obsidianmd/eslint-plugin)
- 依赖漏洞、可疑网络行为等

#### 和「命名不允许」的区别

| | 命名错误 | Release 检查失败 |
|---|---|---|
| 本质 | 名片写错了 | 这一版 Release 或代码没过关 |
| 典型原因 | `name` 用了中文 | 缺文件、版本对不上、ESLint 报错 |
| 去哪看 | PR 评论 / 后台提示 | 后台 **Reviews** 详情 |

#### 常见原因

**Release 和 manifest 版本对不上**

`manifest.json` 写 `"version": "1.0.1"`，GitHub 上就必须有 tag `1.0.1` 的 Release，且附件含 `main.js`、`manifest.json`、`styles.css`。

**三处文案不一致**

仓库 `manifest.json`、Release 里的 `manifest.json`、`community-plugins.json` 的 `id` / `name` / `description` 必须一致。

**代码规范（ESLint）**

常见 Required 项：`no-floating-promises`、`no-explicit-any`、`obsidianmd/ui/sentence-case`（英文 UI）、`restrict-template-expressions` 等。插件内中文界面一般不受 sentence-case 影响。

**网络请求**

Plugin Helper 会 `fetch` 社区插件列表和翻译接口，可能出现在 Suspicious behaviors 里，通常不直接拦，但要避免 `eval` 等高风险写法。

#### 怎么处理

1. 登录开发者后台 → 展开 **Reviews**，逐条看 Required / Errors
2. 本地安装 `eslint-plugin-obsidianmd`，改完再发 Release
3. 确认 checklist：`version` 已 bump → `versions.json` 已更新 → 打同名 tag → Release 附件齐全
4. push 后等几小时自动重扫，或在后台对 branch/tag 跑 **preview scan**
5. **不要新开 PR**，在原流程上修；确信误报可评论 `/skip` 说明理由

---

### 其他值得提前知道的点

**`id` 与文件夹名必须一致**

```
.obsidian/plugins/plugin-helper/   ← 文件夹
manifest.json → "id": "plugin-helper"
```

**`id` 命名限制**

- 只能小写字母、数字、连字符、下划线
- 不能包含 `obsidian`
- 不能以 `plugin` 结尾
- 社区里必须唯一

**`isDesktopOnly`**

用了 Node.js API（`fs`、`child_process` 等）必须设 `"isDesktopOnly": true`。只用 Web API 拉网络则 `false`。

**Release 附件缺一不可**

社区插件从 GitHub Release 下载 `main.js`，没发 Release 或附件不全，用户装不上。

---

### 踩坑速查表

| 坑 | 报错关键词 | 去哪看 | 怎么修 |
|---|---|---|---|
| 中文展示名 | `This name is not allowed in the directory` | PR / 后台提示 | `manifest.name` 改英文，UI 继续中文 |
| Release 检查失败 | `failed one or more automated checks` | 后台 **Reviews** | 对齐 version/附件，按 ESLint 逐条改 |
| 版本找不到 | `Unable to find a release with the tag` | Reviews / PR 评论 | 打同名 tag，挂好附件 |
| 文件夹不匹配 | 部分 API 静默失效 | 本地自测 | 目录名 = `manifest.id` |

---

**市场用英文名片（Plugin Helper），插件里用中文体验（插件说明书）**——两套名字各干各的，互不冲突。
