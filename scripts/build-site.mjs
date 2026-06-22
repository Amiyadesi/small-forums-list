import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, '_site');
const siteBase = '/';
const siteOrigin = 'https://forums.cc.cd';
const repo = 'Amiyadesi/small-forums-list';
const repoId = 'R_kgDOTBXYcA';
const giscusCategory = 'General';
const giscusCategoryId = 'DIC_kwDOTBXYcM4C_omU';

const categories = [
  ['tech_ai_dev', '技术 / AI / 开发者'],
  ['host_webmaster', '主机 / VPS / 站长 / 独立站'],
  ['search_resource_tools', '搜索 / 资源 / 知识工具'],
  ['security_system_software', '安全 / 逆向 / 系统 / 软件'],
  ['acg_game_niche', 'ACG / 游戏 / 小圈子'],
  ['hardware_homelab', '硬件 / 电子 / Homelab'],
  ['adult_resource_gray', '成人 / 资源 / 灰区'],
  ['overseas_old_forum', '海外老论坛 / 泛兴趣']
];

const categoryMap = Object.fromEntries(categories);
const communities = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'communities.json'), 'utf8'));
const slugOverrides = {
  '奶昔论坛': 'naixi-forum',
  '大佬论坛': 'dalao',
  '恩山无线论坛': 'right-openwrt',
  '萌国萌站广场': 'moe-icp',
  '虫部落': 'chongbuluo',
  '吾爱破解': '52pojie',
  '看雪论坛': 'kanxue',
  '卡饭论坛': 'kafan',
  '远景论坛': 'pcbeta',
  '无忧启动论坛': 'wuyou',
  '天使动漫论坛': 'tsdm',
  '数码之家': 'mydigit',
  '南+ / Level Plus': 'south-plus-level-plus',
  '草榴社区': 'caoliu',
  '富贵论坛': 'fglt',
  '福利吧论坛': 'fuliba'
};

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(input) {
  if (slugOverrides[input]) return slugOverrides[input];

  const ascii = String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return ascii || `community-${simpleHash(input)}`;
}

function simpleHash(input) {
  let hash = 0;
  for (const char of String(input)) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash.toString(36);
}

const usedSlugs = new Map();
for (const community of communities) {
  const baseSlug = slugify(community.name);
  let slug = baseSlug;
  let index = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  usedSlugs.set(slug, community.name);
  community.slug = slug;
}

function linkToCommunity(item) {
  return `${siteBase}communities/${item.slug}/`;
}

const communitiesByCategory = categories.map(([id, name]) => ({
  id,
  name,
  items: communities.filter((item) => item.category === id)
}));

function homeAnchor(id) {
  return `${siteBase}#${id}`;
}

function renderSidebar({ activeCategory = '', activeSlug = '' } = {}) {
  const categoryLinks = communitiesByCategory.map(({ id, name, items }) => {
    const active = activeCategory === id ? ' is-active' : '';
    const searchText = [name, id].join(' ');
    return `<a class="nav-link${active}" href="${homeAnchor(id)}" data-search-item data-search-text="${escapeHtml(searchText)}">${escapeHtml(name)}<span>${items.length}</span></a>`;
  }).join('\n');

  const communityGroups = communitiesByCategory.map(({ id, name, items }) => {
    const defaultOpen = !activeCategory || activeCategory === id;
    const itemLinks = items.map((item) => {
      const active = activeSlug === item.slug ? ' is-active' : '';
      const searchText = [
        item.name,
        ...(item.aliases || []),
        categoryMap[item.category] ?? item.category,
        item.language,
        ...(item.tags || [])
      ].flat().join(' ');
      return `<li data-search-item data-search-text="${escapeHtml(searchText)}"><a class="${active}" href="${linkToCommunity(item)}">${escapeHtml(item.name)}</a></li>`;
    }).join('\n');

    return `<details class="community-nav-group"${defaultOpen ? ' open data-default-open' : ''} data-search-group data-search-text="${escapeHtml(`${name} ${id}`)}">
  <summary>${escapeHtml(name)}</summary>
  <ul>
${itemLinks}
  </ul>
</details>`;
  }).join('\n');

  return `<aside class="docs-sidebar" aria-label="站点目录">
  <div class="sidebar-inner">
    <a class="sidebar-title" href="${siteBase}">Small Forums List</a>
    <p class="sidebar-subtitle">小型论坛与圈内社区目录</p>
    <label class="sidebar-search">
      <span>Search</span>
      <input type="search" placeholder="搜索社区 / 分类" autocomplete="off" data-site-search>
    </label>
    <nav class="docs-nav">
      <a class="nav-link" href="${homeAnchor('overview')}">概览</a>
      <a class="nav-link" href="${homeAnchor('category-index')}">分类总览</a>
      <div class="nav-heading">分类</div>
${categoryLinks}
      <div class="nav-heading">社区索引</div>
${communityGroups}
    </nav>
  </div>
</aside>`;
}

function renderShell({ title, description, body, canonicalPath = siteBase, activeCategory = '', activeSlug = '' }) {
  const fullTitle = title === 'Small Forums List' ? title : `${title} - Small Forums List`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${siteOrigin}${canonicalPath}">
  <link rel="icon" href="${siteBase}favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${siteBase}assets/styles.css">
  <script src="${siteBase}assets/site.js" defer></script>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${siteBase}">Small Forums List</a>
      <nav class="top-nav" aria-label="主导航">
        <a href="${siteBase}">目录</a>
        <a href="https://github.com/${repo}">GitHub</a>
        <a href="https://github.com/${repo}/discussions">评论区</a>
      </nav>
    </div>
  </header>
  <main class="docs-layout">
${renderSidebar({ activeCategory, activeSlug })}
    <div class="docs-content">
${body}
    </div>
  </main>
  <footer class="site-footer">
    <div>由 <a href="https://github.com/${repo}">${repo}</a> 生成。欢迎提交 PR 修正社区信息。</div>
  </footer>
</body>
</html>`;
}

function renderMetaRow(label, value) {
  if (!value || (Array.isArray(value) && value.length === 0)) return '';
  const content = Array.isArray(value) ? value.map(escapeHtml).join('、') : escapeHtml(value);
  return `<dt>${escapeHtml(label)}</dt><dd>${content}</dd>`;
}

function renderCommunityCard(item) {
  const tagList = (item.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  return `<article class="wiki-entry">
  <h3><a href="${linkToCommunity(item)}">${escapeHtml(item.name)}</a></h3>
  <p>${escapeHtml(item.vibe)}</p>
  <div class="entry-meta">
    <span>${escapeHtml(item.language)}</span>
    ${tagList}
  </div>
  <div class="entry-links">
    <a href="${linkToCommunity(item)}">详情</a>
    <a href="${escapeHtml(item.url)}">入口</a>
  </div>
</article>`;
}

function renderIndex() {
  const latestChecked = communities.reduce((latest, item) => item.last_checked > latest ? item.last_checked : latest, '');
  const categoryNav = categories.map(([id, name]) => {
    const count = communities.filter((item) => item.category === id).length;
    return `<a href="#${id}">${escapeHtml(name)}<span>${count}</span></a>`;
  }).join('\n');

  const sections = categories.map(([id, name]) => {
    const items = communities.filter((item) => item.category === id);
    return `<section class="wiki-section" id="${id}">
  <div class="section-title">
    <h2>${escapeHtml(name)}</h2>
    <span>${items.length} 个</span>
  </div>
  <div class="wiki-entry-list">
${items.map(renderCommunityCard).join('\n')}
  </div>
</section>`;
  }).join('\n');

  return renderShell({
    title: 'Small Forums List',
    description: '国内外小型、圈内、传统论坛和隐藏社区入口列表。',
    body: `    <section class="intro doc-hero" id="overview">
      <h1>Small Forums List</h1>
      <p>整理国内外小型、圈内、传统论坛和隐藏社区入口。这里的“小型”不是严格按用户量计算，而是指不主动搜索、不混相关领域，基本不会自然刷到的社区。</p>
      <p>目前主要由 AI 按公开信息、站点页面和少量个人体验整理；只有一部分社区是长期进入体验过的。欢迎各社区成员提交 PR，补充真实看法和更准确的注册、氛围、入口信息。</p>
      <div class="stats">
        <span>${communities.length} 个社区</span>
        <span>${categories.length} 个分类</span>
        <span>核验 ${escapeHtml(latestChecked)}</span>
      </div>
    </section>
    <section class="doc-panel" id="category-index">
      <h2>分类总览</h2>
      <p>按大方向先分组，再在左侧索引和下方条目中进入具体社区页面。每个社区页底部都有评论区，方便补充真实体验和修正信息。</p>
      <nav class="category-nav" aria-label="分类目录">
${categoryNav}
      </nav>
    </section>
${sections}`
  });
}

function renderGiscus(item) {
  return `<section class="comments" aria-labelledby="comments-title">
  <h2 id="comments-title">社区留言</h2>
  <p>欢迎补充你对 ${escapeHtml(item.name)} 的真实体验、注册状态和分类修正。评论由 GitHub Discussions / Giscus 承载。</p>
  <script src="https://giscus.app/client.js"
    data-repo="${repo}"
    data-repo-id="${repoId}"
    data-category="${giscusCategory}"
    data-category-id="${giscusCategoryId}"
    data-mapping="pathname"
    data-strict="1"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="preferred_color_scheme"
    data-lang="zh-CN"
    crossorigin="anonymous"
    async>
  </script>
  <noscript>需要启用 JavaScript 才能加载评论区。</noscript>
</section>`;
}

function renderCommunityPage(item) {
  const aliases = item.aliases && item.aliases.length ? item.aliases : [];
  const risks = item.risks && item.risks.length ? item.risks : [];
  const sources = item.sources && item.sources.length ? item.sources : [];
  const sourceList = sources.map((source) => `<li><a href="${escapeHtml(source)}">${escapeHtml(source)}</a></li>`).join('\n');
  const body = `    <a class="back-link" href="${siteBase}#${item.category}">返回 ${escapeHtml(categoryMap[item.category] ?? item.category)}</a>
    <article class="detail">
      <header class="detail-header">
        <p>${escapeHtml(categoryMap[item.category] ?? item.category)}</p>
        <h1>${escapeHtml(item.name)}</h1>
        <a class="primary-link" href="${escapeHtml(item.url)}">访问入口</a>
      </header>
      <dl class="meta-list">
        ${renderMetaRow('别名', aliases)}
        ${renderMetaRow('语言', item.language)}
        ${renderMetaRow('分类', categoryMap[item.category] ?? item.category)}
        ${renderMetaRow('标签', item.tags)}
        ${renderMetaRow('常见风险/注意点', risks)}
        ${renderMetaRow('最后核验', item.last_checked)}
      </dl>
      <section>
        <h2>定位 / 氛围</h2>
        <p>${escapeHtml(item.vibe)}</p>
      </section>
      <section>
        <h2>注册方式</h2>
        <p>${escapeHtml(item.registration)}</p>
      </section>
      <section>
        <h2>适合看 / 里面有什么</h2>
        <p>${escapeHtml(item.benefits)}</p>
      </section>
      <section>
        <h2>注意</h2>
        <p>${escapeHtml(item.notes)}</p>
      </section>
      <section>
        <h2>来源</h2>
        <ul class="source-list">
${sourceList}
        </ul>
      </section>
    </article>
    ${renderGiscus(item)}`;

  return renderShell({
    title: item.name,
    description: `${item.name} 的入口、定位、注册方式、内容类型和注意事项。`,
    canonicalPath: `${siteBase}communities/${item.slug}/`,
    activeCategory: item.category,
    activeSlug: item.slug,
    body
  });
}

function writeFile(relativePath, content) {
  const target = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

const styles = `:root {
  color-scheme: light dark;
  --bg: #f6f7f8;
  --sidebar: #ffffff;
  --surface: #ffffff;
  --surface-2: #eef2f4;
  --text: #172027;
  --muted: #65717b;
  --border: #d9e0e5;
  --accent: #0f766e;
  --accent-soft: #dff4f0;
  --danger: #a14335;
  --code: #f3f5f7;
  --header-h: 56px;
  --sidebar-w: 286px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121619;
    --sidebar: #171c20;
    --surface: #1b2025;
    --surface-2: #222a30;
    --text: #eef3f6;
    --muted: #aab4bc;
    --border: #334049;
    --accent: #5eead4;
    --accent-soft: rgba(94, 234, 212, 0.14);
    --danger: #f09a8a;
    --code: #11171b;
  }
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.68;
}
a {
  color: inherit;
  text-decoration-color: color-mix(in srgb, var(--accent), transparent 45%);
  text-underline-offset: 0.22em;
}
a:hover { color: var(--accent); }
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  min-height: var(--header-h);
  background: color-mix(in srgb, var(--surface), transparent 8%);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-h);
  padding: 0 22px;
  gap: 18px;
}
.brand { font-weight: 760; text-decoration: none; letter-spacing: 0; }
.top-nav { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: var(--muted); }
.top-nav a { text-decoration: none; }
.docs-layout {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  align-items: start;
  min-height: calc(100vh - var(--header-h));
}
.docs-sidebar {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow: auto;
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}
.sidebar-inner { padding: 20px 18px 28px; }
.sidebar-title {
  display: block;
  font-size: 18px;
  font-weight: 760;
  text-decoration: none;
}
.sidebar-subtitle {
  margin: 4px 0 18px;
  color: var(--muted);
  font-size: 13px;
}
.sidebar-search {
  display: grid;
  gap: 6px;
  margin: 0 0 16px;
}
.sidebar-search span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  letter-spacing: 0.04em;
}
.sidebar-search input {
  width: 100%;
  min-height: 36px;
  padding: 7px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
}
.sidebar-search input::placeholder { color: var(--muted); }
.sidebar-search input:focus {
  outline: 2px solid color-mix(in srgb, var(--accent), transparent 50%);
  outline-offset: 1px;
  border-color: color-mix(in srgb, var(--accent), var(--border) 45%);
}
.docs-nav { display: grid; gap: 4px; font-size: 14px; }
.nav-heading {
  margin: 18px 0 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  letter-spacing: 0.04em;
}
.nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--muted);
  text-decoration: none;
}
.nav-link span { font-size: 12px; }
.nav-link:hover,
.nav-link.is-active {
  background: var(--accent-soft);
  color: var(--text);
}
.community-nav-group {
  border-radius: 6px;
}
.community-nav-group summary {
  cursor: pointer;
  min-height: 32px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--muted);
  list-style-position: inside;
}
.community-nav-group summary:hover { background: var(--surface-2); color: var(--text); }
.community-nav-group ul {
  display: grid;
  gap: 1px;
  margin: 2px 0 10px 16px;
  padding: 0;
  list-style: none;
}
.community-nav-group a {
  display: block;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--muted);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.community-nav-group a:hover,
.community-nav-group a.is-active {
  background: var(--accent-soft);
  color: var(--text);
}
[data-search-item][hidden],
[data-search-group][hidden] { display: none; }
.docs-content {
  width: min(100%, 1100px);
  padding: 38px clamp(24px, 5vw, 64px) 64px;
}
.doc-hero {
  padding: 8px 0 26px;
  border-bottom: 1px solid var(--border);
}
.doc-hero h1 {
  margin: 0 0 14px;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
}
.doc-hero p {
  max-width: 820px;
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 17px;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.stats span,
.entry-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 3px 9px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  font-size: 13px;
}
.doc-panel {
  margin: 26px 0 34px;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.doc-panel h2 { margin: 0 0 8px; font-size: 22px; }
.doc-panel p { margin: 0 0 14px; color: var(--muted); }
.category-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.category-nav a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  padding: 7px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  text-decoration: none;
}
.category-nav span { color: var(--muted); font-size: 13px; }
.wiki-section {
  margin: 0 0 42px;
  scroll-margin-top: calc(var(--header-h) + 18px);
}
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 10px;
}
.section-title h2 { margin: 0; font-size: 26px; letter-spacing: 0; }
.section-title span { color: var(--muted); font-size: 14px; }
.wiki-entry-list {
  display: grid;
  gap: 0;
}
.wiki-entry {
  position: relative;
  display: grid;
  grid-template-columns: minmax(160px, 0.28fr) minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.wiki-entry h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
}
.wiki-entry h3 a { text-decoration: none; }
.wiki-entry p {
  margin: 0;
  color: var(--muted);
}
.entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  grid-column: 2 / 3;
}
.entry-links {
  display: flex;
  gap: 10px;
  white-space: nowrap;
  font-size: 14px;
}
.back-link {
  display: inline-flex;
  margin-bottom: 16px;
  color: var(--muted);
}
.detail,
.comments {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: clamp(20px, 4vw, 38px);
}
.detail-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 18px;
  align-items: end;
  margin-bottom: 22px;
}
.detail-header p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--danger);
  font-size: 14px;
}
.detail-header h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.1;
  letter-spacing: 0;
}
.primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 7px 14px;
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 650;
}
.primary-link:hover { color: #fff; filter: brightness(0.96); }
.meta-list {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 10px 18px;
  padding: 16px 0;
  margin: 0 0 10px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.meta-list dt { color: var(--muted); }
.meta-list dd { margin: 0; overflow-wrap: anywhere; }
.detail section { margin-top: 24px; }
.detail h2,
.comments h2 { margin: 0 0 8px; font-size: 21px; }
.detail p,
.comments p { margin: 0; color: var(--muted); }
.source-list { margin: 0; padding-left: 20px; overflow-wrap: anywhere; }
.comments { margin-top: 20px; }
.site-footer {
  margin-left: var(--sidebar-w);
  border-top: 1px solid var(--border);
  padding: 22px clamp(24px, 5vw, 64px) 34px;
  color: var(--muted);
  font-size: 14px;
}
@media (max-width: 960px) {
  :root { --header-h: auto; }
  .site-header { position: static; }
  .header-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 16px;
  }
  .docs-layout { display: block; }
  .docs-sidebar {
    position: static;
    height: auto;
    max-height: 48vh;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-inner { padding: 14px 16px 16px; }
  .docs-content { padding: 28px 16px 48px; }
  .site-footer { margin-left: 0; padding: 20px 16px 30px; }
  .category-nav { grid-template-columns: 1fr; }
  .wiki-entry {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .entry-meta { grid-column: auto; }
  .entry-links { white-space: normal; }
  .detail-header { grid-template-columns: 1fr; }
  .primary-link { width: 100%; }
  .meta-list { grid-template-columns: 1fr; gap: 2px; }
}`;

const siteScript = `(() => {
  const input = document.querySelector('[data-site-search]');
  if (!input) return;

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const groups = [...document.querySelectorAll('[data-search-group]')];
  const categoryLinks = [...document.querySelectorAll('.nav-link[data-search-item]')];

  const applyFilter = () => {
    const query = normalize(input.value);
    categoryLinks.forEach((link) => {
      link.hidden = query ? !normalize(link.dataset.searchText).includes(query) : false;
    });

    groups.forEach((group) => {
      const items = [...group.querySelectorAll('li[data-search-item]')];
      const groupMatch = query && normalize(group.dataset.searchText).includes(query);
      let visibleCount = 0;

      items.forEach((item) => {
        const match = !query || groupMatch || normalize(item.dataset.searchText).includes(query);
        item.hidden = !match;
        if (match) visibleCount += 1;
      });

      group.hidden = query ? visibleCount === 0 : false;
      if (query && visibleCount > 0) {
        group.open = true;
      } else if (!query) {
        group.open = group.hasAttribute('data-default-open');
      }
    });
  };

  input.addEventListener('input', applyFilter);
  input.addEventListener('search', applyFilter);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    input.value = '';
    applyFilter();
  });
})();`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f766e"/>
  <path fill="#ffffff" d="M16 17h32v6H16zM16 29h32v6H16zM16 41h22v6H16z"/>
</svg>
`;

ensureCleanDir(outputDir);
writeFile('assets/styles.css', styles);
writeFile('assets/site.js', siteScript);
writeFile('favicon.svg', favicon);
writeFile('index.html', renderIndex());
for (const community of communities) {
  writeFile(path.join('communities', community.slug, 'index.html'), renderCommunityPage(community));
}
writeFile('communities.json', JSON.stringify(communities.map(({ slug, ...item }) => ({ slug, ...item })), null, 2) + '\n');
writeFile('CNAME', 'forums.cc.cd\n');
writeFile('.nojekyll', '');

console.log(`Built ${communities.length} community pages in ${outputDir}`);
