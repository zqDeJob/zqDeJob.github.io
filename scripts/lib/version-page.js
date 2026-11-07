'use strict'

const { execFileSync } = require('child_process')
const path = require('path')
const { writeIfChanged } = require('./write-if-changed')

const FIELD_SEP = '\x1f'
const DEFAULTS = {
  slug: 'zqDeJob/zqDeJob.github.io',
  branch: 'master',
  limit: 10
}

function getRepoConfig (overrides = {}) {
  return {
    slug: overrides.github || DEFAULTS.slug,
    branch: overrides.branch || DEFAULTS.branch,
    limit: overrides.changelog_limit || DEFAULTS.limit
  }
}

function escapeTableCell (text) {
  return String(text)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim()
}

function detectBranch (repoRoot, fallback) {
  try {
    const name = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8'
    }).trim()
    if (name && name !== 'HEAD') return name
  } catch {
    // 脱离 HEAD 时沿用默认分支名，只用于 GitHub 链接
  }
  return fallback
}

function fetchCommitsFromGit (repoRoot, cfg) {
  try {
    const output = execFileSync(
      'git',
      [
        'log',
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

function buildVersionMarkdown (commits, cfg) {
  const repoUrl = `https://github.com/${cfg.slug}`
  const lines = [
    '---',
    'title: 版本记录',
    'prev: false',
    'next: false',
    '---',
    '',
    '# 版本记录',
    '',
    `本页记录 [${cfg.slug}](${repoUrl}) 的提交（构建时自动生成，最近 ${cfg.limit} 条）。`,
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
  docsDir,
  log = console
}) {
  const cfg = getRepoConfig()
  cfg.branch = detectBranch(repoRoot, cfg.branch)
  const file = path.join(docsDir, 'version', 'index.md')
  const result = fetchCommitsFromGit(repoRoot, cfg)

  if (result.error) {
    const msg = `version: git log failed, ${result.error}`
    if (typeof log.warn === 'function') log.warn(msg)
    else console.warn(msg)
    return { file, changed: false, commits: [] }
  }

  const body = buildVersionMarkdown(result, cfg)
  const changed = writeIfChanged(file, body)

  if (changed) {
    const rel = path.relative(repoRoot, file)
    if (typeof log.info === 'function') log.info('version: wrote %s', rel)
    else console.log('version: wrote', rel)
  }

  return { file, changed, commits: result }
}

module.exports = {
  getRepoConfig,
  fetchCommitsFromGit,
  buildVersionMarkdown,
  syncVersionPage
}
