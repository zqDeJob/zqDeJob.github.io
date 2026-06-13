'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { writeIfChanged } = require('./write-if-changed')

const FIELD_SEP = '\x1f'

function getRepoConfig (hexoConfig) {
  const repo = (hexoConfig && hexoConfig.repo) || {}
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

function fetchCommitsFromGit (repoRoot, cfg) {
  try {
    const output = execFileSync(
      'git',
      [
        'log',
        cfg.branch,
        '-n',
        String(cfg.limit),
        `--pretty=format:%H${FIELD_SEP}%h${FIELD_SEP}%ad${FIELD_SEP}%an${FIELD_SEP}%s`,
        '--date=short'
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      }
    )

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [full, short, date, author, ...messageParts] = line.split(FIELD_SEP)
        return {
          full,
          short,
          date,
          author,
          message: messageParts.join(FIELD_SEP)
        }
      })
  } catch (error) {
    return { error: error.message }
  }
}

function buildVersionMarkdown (commits, cfg, { generatedAt = new Date() } = {}) {
  const repoUrl = `https://github.com/${cfg.slug}`
  const dateStr = generatedAt.toISOString().replace('T', ' ').substring(0, 19)
  const lines = [
    '---',
    'title: 版本记录',
    `date: ${dateStr}`,
    'type: page',
    'comments: false',
    'top_img: false',
    '---',
    '',
    `本页记录 [${cfg.slug}](${repoUrl}) 仓库的 Git 提交历史（构建时自动获取，最近 ${cfg.limit} 条）。`,
    '',
    `[在 GitHub 查看完整提交记录](${repoUrl}/commits/${cfg.branch}/)`,
    '',
    '| 日期 | 提交 | 作者 | 说明 |',
    '| --- | --- | --- | --- |'
  ]

  for (const commit of commits) {
    const link = `[${commit.short}](${repoUrl}/commit/${commit.full})`
    lines.push(
      `| ${commit.date} | ${link} | ${escapeTableCell(commit.author)} | ${escapeTableCell(commit.message)} |`
    )
  }

  if (!commits.length) {
    lines.push('| — | — | — | 获取提交记录失败 |')
  }

  lines.push('')
  return lines.join('\n')
}

function syncVersionPage ({
  repoRoot,
  sourceDir,
  hexoConfig,
  log = console
}) {
  const cfg = getRepoConfig(hexoConfig)
  const dir = path.join(sourceDir, 'version')
  const file = path.join(dir, 'index.md')
  const result = fetchCommitsFromGit(repoRoot, cfg)

  if (result.error) {
    const msg = `generate-version: git log failed, ${result.error}`
    if (typeof log.warn === 'function') log.warn(msg)
    else console.warn(msg)
    return { file, changed: false, commits: [] }
  }

  const body = buildVersionMarkdown(result, cfg)
  const changed = writeIfChanged(file, body)

  if (changed) {
    const rel = path.relative(repoRoot, file)
    if (typeof log.info === 'function') {
      log.info('generate-version: wrote %s', rel)
    } else {
      console.log('generate-version: wrote', rel)
    }
  }

  return { file, changed, commits: result }
}

module.exports = {
  getRepoConfig,
  fetchCommitsFromGit,
  buildVersionMarkdown,
  syncVersionPage
}
