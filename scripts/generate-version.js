'use strict'

/**
 * 根据 git log 生成「版本」页面（source/version/index.md）
 * 配置见 _config.yml 的 repo
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const FRONT_MATTER = `---
title: 版本记录
date: 2026-05-21 12:00:00
type: page
comments: false
top_img: false
---

`

function getRepoConfig () {
  const repo = hexo.config.repo || {}
  return {
    slug: repo.github || 'zqDeJob/zqDeJob.github.io',
    branch: repo.branch || 'master',
    limit: repo.changelog_limit || 80
  }
}

function escapeTableCell (text) {
  return String(text)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim()
}

function fetchCommits (cfg) {
  const format = '%H|%h|%ad|%an|%s'
  const out = execSync(
    `git log --pretty=format:"${format}" --date=short -n ${cfg.limit}`,
    { cwd: hexo.base_dir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  )
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [full, short, date, author, ...msg] = line.split('|')
      return {
        full,
        short,
        date,
        author,
        message: msg.join('|')
      }
    })
}

function buildMarkdown (commits, cfg) {
  const repoUrl = `https://github.com/${cfg.slug}`
  const lines = [
    FRONT_MATTER.trimEnd(),
    '',
    `本页记录 [${cfg.slug}](${repoUrl}) 仓库的 Git 提交历史（构建时自动生成，默认最近 ${cfg.limit} 条）。`,
    '',
    `[在 GitHub 查看完整提交记录](${repoUrl}/commits/${cfg.branch}/)`,
    '',
    '| 日期 | 提交 | 作者 | 说明 |',
    '| --- | --- | --- | --- |'
  ]

  for (const c of commits) {
    const link = `[${c.short}](${repoUrl}/commit/${c.full})`
    lines.push(
      `| ${c.date} | ${link} | ${escapeTableCell(c.author)} | ${escapeTableCell(c.message)} |`
    )
  }

  if (!commits.length) {
    lines.push('| — | — | — | 暂无提交记录（本地未初始化 Git 或 CI 浅克隆） |')
  }

  lines.push('')
  return lines.join('\n')
}

function writeVersionPage () {
  const cfg = getRepoConfig()
  const dir = path.join(hexo.source_dir, 'version')
  const file = path.join(dir, 'index.md')

  fs.mkdirSync(dir, { recursive: true })

  let body
  try {
    body = buildMarkdown(fetchCommits(cfg), cfg)
  } catch (e) {
    hexo.log.warn('generate-version: git log failed,', e.message)
    body = buildMarkdown([], cfg)
  }

  fs.writeFileSync(file, body, 'utf8')
  hexo.log.info('generate-version: wrote %s', path.relative(hexo.base_dir, file))
}

hexo.extend.filter.register('before_generate', writeVersionPage)
hexo.on('ready', writeVersionPage)
