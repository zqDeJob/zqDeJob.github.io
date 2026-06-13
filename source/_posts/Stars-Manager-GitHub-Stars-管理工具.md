---
title: Stars Manager：GitHub Stars 管理工具
date: 2026-06-13 10:00:00
categories:
  - 研发二三事
tags:
  - GitHub
  - Stars
  - 工具
  - 开源
---
cover: /img/covers/Stars-Manager-GitHub-Stars-管理工具.jpg

GitHub 的 Star 功能很好用，但 star 多了之后，原生界面很难做精细管理：搜索不够顺手、没法按自己的思路分组、也缺少本地备注和 Tag。 
有个项目叫 github-stars-manager，试用了下感觉很复杂，我平时没有那么多的需求。
于是写了 **[Stars Manager](https://github.com/zqDeJob/starsManager)** —— 一个精简的 GitHub Stars 管理工具，支持 **Web**、**Windows 桌面版**、**Chrome / Edge 扩展** 三种方式，核心功能一致。

---

## 背景：为什么要自己做

日常刷 GitHub 时，看到不错的仓库就顺手 star，时间一长数量上百。真正要用的时候，常见问题有：

- **找不回来**：只记得大概关键词，原生搜索体验一般
- **分类对不上**：GitHub 官方的 Star Lists 能用，但和「我脑子里的分类」往往不一致
- **缺少本地信息**：想给某个仓库加一句「以后做 XX 项目时参考」，GitHub 本身不支持
- **多设备不同步**：换电脑、换浏览器，DIY 的整理成果不好带过去

Stars Manager 的定位就是：**Stars 从 GitHub 拉，整理逻辑放本地**，用 YAML 存 DIY 数据，Web / exe / 扩展之间可以互通。

---

## 能做什么

| 功能 | 说明 |
|------|------|
| **GitHub Stars** | 同步并浏览已 star 的仓库，支持搜索 |
| **GitHub Star Lists** | 查看 GitHub 官方 Star Lists（只读） |
| **我的分类** | 本地 DIY 分类、描述、Tag，与 GitHub Lists 完全独立 |
| **深色 / 浅色主题** | 自动记忆偏好 |
| **多设备同步** | 通过 `stars-data.yaml` 在 Web / exe / 扩展间互通 |

### 界面预览

**Stars 列表** —— 浏览、搜索已 star 的仓库：

![GitHub Stars 列表](/img/posts/stars-manager/stars.png)

**Star Lists** —— 查看 GitHub 官方列表：

![GitHub Star Lists](/img/posts/stars-manager/lists.png)

**我的分类** —— 本地 DIY 分类、描述与 Tag：

![我的分类](/img/posts/stars-manager/diy-categories.png)

---

## 三种使用方式

### 1. Windows 桌面版（推荐日常使用）

不想折腾环境的话，直接下载安装包：

**[Releases 下载页](https://github.com/zqDeJob/starsManager/releases)**

安装后数据目录在：

```text
C:\Users\你\AppData\Roaming\stars-manager-for-me\data\
```

### 2. Web 版（开发 / 浏览器）

适合想改代码、或习惯在浏览器里用的场景：

```bash
git clone git@github.com:zqDeJob/starsManager.git
cd starsManager
npm install
npm run dev
```

浏览器打开 http://localhost:5173

### 3. 浏览器扩展（Chrome / Edge）

适合 star 完顺手打开整理：

```bash
npm install
npm run build:extension
```

加载步骤：

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择项目里的 `extension/dist`
4. 点击扩展图标 → 新标签页打开完整界面

扩展与 Web / 桌面版功能一致。设置里可以 **导出 / 导入 `stars-data.yaml`**，或勾选 **连接本地服务**（`http://127.0.0.1:3001`，需先 `npm run dev`）共用磁盘数据。

---

## 使用步骤

1. 打开 **设置**，填入 [GitHub Personal Access Token](https://github.com/settings/tokens)（需 `read:user` 权限）
2. 点击 **同步**，拉取 Stars 和 Star Lists
3. 切到 **分类** Tab，给仓库建 DIY 分类、写描述、打 Tag

Token 只保存在本地，**不要提交到 Git**。

---

## 数据怎么存、怎么同步

所有 DIY 数据以 **YAML** 保存。Stars 列表本身可以随时从 GitHub 重新拉，**真正需要备份 / 同步的是 DIY 部分**。

| 文件 | 说明 | 是否提交 Git |
|------|------|-------------|
| `stars-data.yaml` | DIY 分类、描述、Tag | ✅ 可提交，用于多设备同步 |
| `github-cache.yaml` | Stars / Lists 缓存 | ❌ 可重新同步 |
| `local.yaml` | GitHub Token | ❌ **切勿提交** |

### 多设备同步（Git）

1. 把 `stars-data.yaml` 放进一个 Git 仓库（私有即可）
2. 各设备保持该文件一致（`git pull` / `git push`）
3. 改完分类 / Tag 后提交，另一台设备拉取后重启应用

### 扩展 ↔ 桌面版互通

- 扩展 **导出** `stars-data.yaml` → 复制到桌面版数据目录  
- 或桌面版导出 → 扩展 **导入**

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | Web 开发（client + server） |
| `npm run pack` | 构建并打包 Windows exe |
| `npm run build:extension` | 构建浏览器扩展 |
| `npm run dev:extension` | 扩展 watch 模式 |

---

## 技术栈

React 19 · Vite · Tailwind CSS 4 · Zustand · Express · YAML · Electron · Chrome Extension MV3

源码：[github.com/zqDeJob/starsManager](https://github.com/zqDeJob/starsManager)

---

## 小结

如果你也有「star 越来越多、越找越乱」的困扰，可以试试 Stars Manager：  
**Stars 交给 GitHub，分类和 Tag 留给自己**，三种形态任选，YAML 文件还能用 Git 在多设备间同步。

有问题或建议，欢迎到仓库提 Issue。
