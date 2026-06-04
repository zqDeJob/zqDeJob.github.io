'use strict'

/**
 * 根据 GitHub API 生成「版本」页面（source/version/index.md）
 * 配置见 _config.yml 的 repo
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { writeIfChanged } = require('./lib/write-if-changed')

const FRONT_MATTER = `---
title: 版本记录
date: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
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
    limit: repo.changelog_limit || 10
  }
}

function escapeTableCell (text) {
  return String(text)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim()
}

async function fetchCommitsFromAPI (cfg) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${cfg.slug}/commits`, {
      params: {
        per_page: cfg.limit,
        sha: cfg.branch
      }
    })

    return response.data.map(commit => ({
      full: commit.sha,
      short: commit.sha.substring(0, 7),
      date: new Date(commit.commit.author.date).toISOString().split('T')[0],
      author: commit.author ? commit.author.login : commit.commit.author.name,
      message: commit.commit.message.split('\n')[0]
    }))
  } catch (error) {
    hexo.log.warn('generate-version: GitHub API request failed,', error.message)
    return []
  }
}

function buildMarkdown (commits, cfg) {
  const repoUrl = `https://github.com/${cfg.slug}`
  const lines = [
    FRONT_MATTER.trimEnd(),
    '',
    `本页记录 [${cfg.slug}](${repoUrl}) 仓库的 Git 提交历史（构建时自动获取，最近 ${cfg.limit} 条）。`,
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
    lines.push('| — | — | — | 获取提交记录失败 |')
  }

  lines.push('')
  return lines.join('\n')
}

async function writeVersionPage () {
  const cfg = getRepoConfig()
  const dir = path.join(hexo.source_dir, 'version')
  const file = path.join(dir, 'index.md')

  fs.mkdirSync(dir, { recursive: true })

  let body
  try {
    const commits = await fetchCommitsFromAPI(cfg)
    body = buildMarkdown(commits, cfg)
  } catch (e) {
    hexo.log.warn('generate-version: failed,', e.message)
    body = buildMarkdown([], cfg)
  }

  if (writeIfChanged(file, body)) {
    hexo.log.info('generate-version: wrote %s', path.relative(hexo.base_dir, file))
  }
}

hexo.extend.filter.register('before_generate', writeVersionPage)