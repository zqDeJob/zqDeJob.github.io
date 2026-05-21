'use strict'

/**
 * 为配置中的页面注入访问密码（静态站前端校验，防君子不防小人）
 * 路径列表见 _config.yml 的 password_pages
 * 密码固定见下方 PASSWORD 常量
 */

const PASSWORD = '342601'
const STORAGE_KEY = 'zqdejob_gallery_auth_v1'

function getProtectedPaths () {
  const list = hexo.config.password_pages
  if (!Array.isArray(list)) return []
  return list.map(p => normalizeRule(p)).filter(Boolean)
}

function normalizeRule (rule) {
  let p = String(rule).trim()
  if (!p) return ''
  if (!p.startsWith('/')) p = '/' + p
  if (!p.endsWith('/')) p += '/'
  return p
}

function normalizeOutputPath (path) {
  let p = '/' + String(path).replace(/index\.html$/i, '').replace(/\\/g, '/')
  if (!p.endsWith('/')) p += '/'
  return p
}

function isProtectedPage (outputPath, rules) {
  if (!rules.length) return false
  const p = normalizeOutputPath(outputPath)
  return rules.some(rule => p === rule || p.startsWith(rule))
}

function buildInjectHtml () {
  const rules = getProtectedPaths()
  const rulesJson = JSON.stringify(rules)

  return `
<div id="page-password-gate" hidden>
  <style>
    #page-password-gate:not([hidden]) {
      display: flex;
      position: fixed;
      inset: 0;
      z-index: 99999;
      align-items: center;
      justify-content: center;
      background: rgba(15, 18, 25, 0.72);
      backdrop-filter: blur(6px);
    }
    .page-password-card {
      width: min(92vw, 360px);
      padding: 1.75rem 1.5rem 1.5rem;
      border-radius: 12px;
      background: var(--card-bg, #fff);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      text-align: center;
      font-family: inherit;
    }
    .page-password-card h2 {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
      color: var(--font-color, #333);
    }
    .page-password-card p {
      margin: 0 0 1rem;
      font-size: 0.88rem;
      opacity: 0.75;
      color: var(--font-color, #666);
    }
    .page-password-card input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }
    .page-password-card button {
      width: 100%;
      padding: 0.6rem;
      border: none;
      border-radius: 8px;
      background: var(--theme-color, #49b1f5);
      color: #fff;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .page-password-card .err {
      color: #e74c3c;
      font-size: 0.82rem;
      min-height: 1.2em;
      margin-top: 0.5rem;
    }
    html.page-pwd-locked #page-header,
    html.page-pwd-locked #content-inner,
    html.page-pwd-locked #footer-wrap {
      visibility: hidden;
    }
  </style>
  <div class="page-password-card" role="dialog" aria-modal="true" aria-labelledby="page-pwd-title">
    <h2 id="page-pwd-title">请输入访问密码</h2>
    <p>本页已加密，仅供知晓密码的访客查看。</p>
    <input id="page-password-input" type="password" inputmode="numeric" autocomplete="off" placeholder="访问密码" />
    <button type="button" id="page-password-submit">进入</button>
    <div class="err" id="page-password-err"></div>
  </div>
</div>
<script>
(function () {
  var PASSWORD = ${JSON.stringify(PASSWORD)};
  var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
  var RULES = ${rulesJson};

  function norm(pathname) {
    var p = pathname || '/';
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.slice(-1) !== '/') p += '/';
    return p;
  }

  function match(pathname) {
    var p = norm(pathname);
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i];
      if (p === r || p.indexOf(r) === 0) return true;
    }
    return false;
  }

  if (!match(location.pathname)) return;

  var gate = document.getElementById('page-password-gate');
  var input = document.getElementById('page-password-input');
  var btn = document.getElementById('page-password-submit');
  var err = document.getElementById('page-password-err');

  function unlock() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    document.documentElement.classList.remove('page-pwd-locked');
    gate.setAttribute('hidden', '');
  }

  function lock() {
    document.documentElement.classList.add('page-pwd-locked');
    gate.removeAttribute('hidden');
    setTimeout(function () { input.focus(); }, 50);
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      unlock();
      return;
    }
  } catch (e) {}

  lock();

  function tryEnter() {
    if (input.value === PASSWORD) {
      err.textContent = '';
      unlock();
    } else {
      err.textContent = '密码不正确';
      input.select();
    }
  }

  btn.addEventListener('click', tryEnter);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryEnter();
  });
})();
</script>
`
}

// Hexo 7：第一个参数是 HTML 字符串，第二个是 locals（含 path），勿与 (data, content) 混淆
hexo.extend.filter.register('after_render:html', (html, locals) => {
  const rules = getProtectedPaths()
  if (!rules.length || typeof html !== 'string') return html
  if (!locals || !locals.path) return html

  if (!isProtectedPage(locals.path, rules)) return html

  const inject = buildInjectHtml()
  return html.includes('</body>')
    ? html.replace('</body>', inject + '</body>')
    : html + inject
})
