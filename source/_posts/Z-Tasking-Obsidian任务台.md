---
title: Z-Tasking：Obsidian 长期 / 临时任务台
date: 2026-08-14 10:50:00
categories:
  - 研发二三事
tags:
  - Obsidian
  - 插件
  - 任务管理
  - 开源
---
cover: /img/covers/Z-Tasking-Obsidian任务台.jpg

## 背景：为什么要自己做

日常任务散落在待办插件、日历和日记里，长期事项又往往只有一个标题，过几天就忘了「做到哪一步了」。

我想要的是：

- **每个任务就是一篇 Markdown 笔记**，说明、进展都写在笔记里，不另起一套数据格式
- **长期 / 临时分开**，长期事项能跨周跨月跟进，临时任务随时起随时结
- **工作台记进展**，列表、日历、甘特图、周期汇总能从同一批笔记里看出来

于是写了 **[Z-Tasking](https://github.com/zqDeJob/obsidian-plugin-ztasking)** —— Obsidian 里的 DIY 任务工作台。插件 id 为 `z-tasking`，避免和社区里其他 tasking 类插件撞名。

---

## 能做什么

| 功能 | 说明 |
|------|------|
| **工作台** | 选中任务，写说明、按日期记进展（支持 Markdown、列表、双向链接） |
| **全量列表** | 浏览长期 / 临时任务及状态 |
| **日历** | 按日期看任务分布 |
| **甘特图** | 看起止时间与跨度 |
| **周期汇总** | 周 / 月 / 季 / 年，或自定时间范围 |

任务都是普通笔记，可以在库里直接打开、搜索、双向链接，不锁死在插件私有数据里。

---

## 笔记怎么放

默认根目录是 `z-tasking/`（可在设置里改）：

```text
z-tasking/
  长期/
    某长期事项.md
  临时/
    某临时任务.md
```

笔记 front matter 示例：

```markdown
---
type: long
status: doing
start: 2026-08-10
end: 2026-09-30
---

任务说明。

## 进展

### [[2026-08-13]]
今天做了什么。支持 **Markdown**、列表和 `[[双向链接]]`。
```

---

## 界面预览

可先打开 **[在线原型](https://obsidian-plugin-ztasking.vercel.app/)** 点一点（Mock 数据，改完刷新即可）。下面是原型截图。

**工作台** —— 记进展、看说明：

![工作台](/img/posts/z-tasking/workbench.png)

**列表** —— 全量浏览任务：

![列表](/img/posts/z-tasking/list.png)

**日历** —— 按日期看分布：

![日历](/img/posts/z-tasking/calendar.png)

**甘特图** —— 看时间跨度：

![甘特图](/img/posts/z-tasking/gantt.png)

**汇总** —— 周月季年或自定范围：

![汇总](/img/posts/z-tasking/report.png)

---

## 怎么安装

当前版本 **0.1.0**，需要 Obsidian **1.5.0** 及以上。社区市场上架前，可用手动安装：

1. 从 [Releases](https://github.com/zqDeJob/obsidian-plugin-ztasking/releases) 下载 `main.js`、`manifest.json`、`styles.css`（若暂无 Release，可 clone 后 `npm run build` 自行生成）
2. 放到：

   ```text
   你的库/.obsidian/plugins/z-tasking/
   ```

3. **设置 → 第三方插件** 中启用 **Z-Tasking**
4. 命令面板：`Z-Tasking: 打开任务台`

本地开发：

```bash
npm install
npm run dev
```

把仓库复制或 junction 到上述插件目录即可热更新调试。

---

## 适合谁

- 想用 Markdown 笔记管任务，而不是另一套封闭待办库
- 长期事项需要「按天写进展」，不只是打勾完成
- 希望同一批任务能在列表、日历、甘特、汇总之间切换看

---

## 源码与反馈

- 仓库：[zqDeJob/obsidian-plugin-ztasking](https://github.com/zqDeJob/obsidian-plugin-ztasking)
- 在线原型：[obsidian-plugin-ztasking.vercel.app](https://obsidian-plugin-ztasking.vercel.app/)
- 许可证：MIT

有问题或建议，欢迎到仓库提 Issue。
