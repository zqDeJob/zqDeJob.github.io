'use strict'

const fs = require('fs')
const path = require('path')

function normalize (text) {
  return String(text).replace(/\r\n/g, '\n')
}

/**
 * 仅当内容有变化时写入，避免 hexo server 监听 source 后死循环
 * @returns {boolean} 是否发生了写入
 */
function writeIfChanged (file, content) {
  const next = normalize(content)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file)) {
    const prev = normalize(fs.readFileSync(file, 'utf8'))
    if (prev === next) return false
  }
  fs.writeFileSync(file, next, 'utf8')
  return true
}

module.exports = { writeIfChanged }
