import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, '_site');
const sourceDir = path.join(repoRoot, 'site');
const siteBase = '/';
const siteOrigin = 'https://forums.cc.cd';
const repo = 'Amiyadesi/small-forums-list';
const repoId = 'R_kgDOTBXYcA';
const giscusCategory = 'General';
const giscusCategoryId = 'DIC_kwDOTBXYcM4C_omU';

const categories = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'categories.json'), 'utf8'));
const communities = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'communities.json'), 'utf8'));
const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category]));

const languageNames = {
  'zh-CN': '中文',
  'zh-TW': '繁中',
  en: 'English',
  ja: '日本語'
};

const iconPaths = {
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7A5.4 5.4 0 0 0 19.22 4 5 5 0 0 0 19.13.5S17.95.14 15 1.86a13.4 13.4 0 0 0-7 0C5.05.14 3.87.5 3.87.5A5 5 0 0 0 3.78 4a5.4 5.4 0 0 0-1.5 3.5c0 5.42 3.44 6.64 6.72 7A4.8 4.8 0 0 0 8 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>'
};

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
  '福利吧论坛': 'fuliba',
  '类脑 / ΟΔΥΣΣΕΙΑ': 'odysseia'
};

function icon(name, className = '') {
  return `<svg class="icon${className ? ` ${className}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
}

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

function simpleHash(input) {
  let hash = 0;
  for (const char of String(input)) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash.toString(36);
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

const communitiesByCategory = categories.map((category) => ({
  ...category,
  items: communities.filter((item) => item.category === category.id)
}));

function linkToCommunity(item) {
  return `${siteBase}communities/${item.slug}/`;
}

function homeAnchor(id) {
  return `${siteBase}#${id}`;
}

function languageGroups(languages) {
  const groups = new Set();
  for (const language of languages || []) {
    if (language.startsWith('zh')) groups.add('zh');
    if (language === 'en') groups.add('en');
    if (language === 'ja') groups.add('ja');
  }
  return [...groups];
}

function displayLanguages(languages) {
  return (languages || []).map((language) => languageNames[language] || language);
}

function communitySearchText(item) {
  return [
    item.name,
    ...(item.aliases || []),
    categoryMap[item.category]?.name || item.category,
    categoryMap[item.category]?.short_name || '',
    ...(item.language || []),
    ...displayLanguages(item.language),
    ...(item.tags || []),
    item.vibe,
    item.benefits
  ].join(' ');
}

function monogram(name) {
  const words = String(name).trim().split(/[\s/]+/).filter(Boolean);
  if (words.length > 1 && /^[\x00-\x7F]+$/.test(name)) {
    return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  }
  return [...String(name).replace(/\s/g, '')].slice(0, 2).join('').toUpperCase();
}

function renderHeader() {
  return `<header class="site-header">
  <div class="header-inner">
    <button class="icon-button nav-toggle" type="button" data-drawer-open aria-controls="site-drawer" aria-expanded="false" aria-label="打开目录" title="打开目录">
      ${icon('menu')}
    </button>
    <a class="brand" href="${siteBase}" aria-label="Small Forums List 首页">
      <span class="brand-mark" aria-hidden="true">SF</span>
      <span class="brand-copy"><strong>Small Forums List</strong><small>小众社区目录</small></span>
    </a>
    <nav class="header-actions" aria-label="站点操作">
      <a class="header-link discussions-link" href="https://github.com/${repo}/discussions">
        ${icon('message')}<span>讨论</span>
      </a>
      <a class="header-link" href="https://github.com/${repo}">
        ${icon('github')}<span>GitHub</span>
      </a>
      <button class="icon-button theme-toggle" type="button" data-theme-toggle aria-label="切换到深色模式" title="切换主题">
        ${icon('sun', 'theme-icon theme-icon-sun')}
        ${icon('moon', 'theme-icon theme-icon-moon')}
      </button>
    </nav>
  </div>
</header>`;
}

function renderSidebar({ activeCategory = '', activeSlug = '' } = {}) {
  const categoryLinks = communitiesByCategory.map(({ id, short_name: shortName, items }) => {
    const active = activeCategory === id ? ' is-active' : '';
    return `<a class="sidebar-link category-link${active}" href="${homeAnchor(id)}" data-category="${escapeHtml(id)}" data-directory-category-link="${escapeHtml(id)}">
      <span class="category-dot" aria-hidden="true"></span>
      <span>${escapeHtml(shortName)}</span>
      <small>${items.length}</small>
    </a>`;
  }).join('\n');

  const communityGroups = communitiesByCategory.map(({ id, short_name: shortName, items }) => {
    const itemLinks = items.map((item) => {
      const active = activeSlug === item.slug ? ' is-active' : '';
      return `<li data-nav-item data-search-text="${escapeHtml(communitySearchText(item))}"><a class="${active}" href="${linkToCommunity(item)}">${escapeHtml(item.name)}</a></li>`;
    }).join('\n');
    const open = activeCategory === id ? ' open' : '';

    return `<details class="community-nav-group" data-nav-group data-category="${escapeHtml(id)}"${open}>
      <summary><span>${escapeHtml(shortName)}</span><small>${items.length}</small></summary>
      <ul>${itemLinks}</ul>
    </details>`;
  }).join('\n');

  return `<aside class="site-sidebar" id="site-drawer" aria-label="社区目录">
  <div class="drawer-heading">
    <span>浏览目录</span>
    <button class="icon-button" type="button" data-drawer-close aria-label="关闭目录" title="关闭目录">${icon('x')}</button>
  </div>
  <div class="sidebar-scroll">
    <div class="sidebar-summary">
      <span>已整理</span>
      <strong>${communities.length} 个社区</strong>
      <small>${categories.length} 个主题分类</small>
    </div>
    <nav class="sidebar-nav" aria-label="主题分类">
      <p class="sidebar-label">主题</p>
      <a class="sidebar-link" href="${siteBase}#directory" data-directory-category-link="all">
        <span class="all-dot" aria-hidden="true"></span>
        <span>全部社区</span>
        <small>${communities.length}</small>
      </a>
      ${categoryLinks}
    </nav>
    <div class="sidebar-index">
      <label class="nav-search">
        <span class="sr-only">搜索侧栏社区索引</span>
        ${icon('search')}
        <input type="search" data-nav-search placeholder="搜索社区索引" autocomplete="off">
        <button type="button" class="input-clear" data-nav-search-clear aria-label="清除索引搜索" title="清除搜索" hidden>${icon('x')}</button>
      </label>
      <p class="sidebar-label">社区索引</p>
      <div class="community-nav-groups">${communityGroups}</div>
      <p class="nav-empty" data-nav-empty hidden>没有匹配的社区</p>
    </div>
  </div>
</aside>`;
}

function renderShell({
  title,
  description,
  body,
  canonicalPath = siteBase,
  activeCategory = '',
  activeSlug = '',
  pageClass = ''
}) {
  const fullTitle = title === 'Small Forums List' ? title : `${title} - Small Forums List`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f7f8f7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#151716" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${siteOrigin}${canonicalPath}">
  <link rel="icon" href="${siteBase}favicon.svg" type="image/svg+xml">
  <script>try{const t=localStorage.getItem('sfl-theme');document.documentElement.dataset.theme=t||((matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light')}catch{}</script>
  <link rel="stylesheet" href="${siteBase}assets/styles.css">
  <script src="${siteBase}assets/site.js" defer></script>
</head>
<body class="${escapeHtml(pageClass)}">
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  ${renderHeader()}
  <div class="drawer-backdrop" data-drawer-backdrop aria-hidden="true"></div>
  <div class="site-layout">
    ${renderSidebar({ activeCategory, activeSlug })}
    <div class="page-column">
      <main class="site-main" id="main-content" tabindex="-1">
${body}
      </main>
      <footer class="site-footer">
        <p>收录不等于推荐或背书。信息可能变化，请以社区当前规则为准。</p>
        <p><a href="https://github.com/${repo}">${repo}</a> · 欢迎通过 PR 修正资料</p>
      </footer>
    </div>
  </div>
</body>
</html>`;
}

function renderCommunityRow(item) {
  const languages = displayLanguages(item.language).map((language) => `<span class="meta-token language-token">${escapeHtml(language)}</span>`).join('');
  const tags = (item.tags || []).slice(0, 3).map((tag) => `<span class="meta-token">${escapeHtml(tag)}</span>`).join('');

  return `<article class="community-row" data-community data-category="${escapeHtml(item.category)}" data-languages="${escapeHtml(languageGroups(item.language).join(' '))}" data-search-text="${escapeHtml(communitySearchText(item))}">
  <a class="community-identity" href="${linkToCommunity(item)}">
    <span class="community-monogram" aria-hidden="true">${escapeHtml(monogram(item.name))}</span>
    <span class="community-name"><strong>${escapeHtml(item.name)}</strong>${item.aliases?.length ? `<small>${escapeHtml(item.aliases[0])}</small>` : ''}</span>
  </a>
  <div class="community-summary">
    <p>${escapeHtml(item.vibe)}</p>
    <div class="community-meta">${languages}${tags}</div>
  </div>
  <div class="community-actions">
    <a class="row-detail" href="${linkToCommunity(item)}" aria-label="查看 ${escapeHtml(item.name)} 详情" title="查看详情">${icon('chevronRight')}</a>
    <a class="row-external" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><span>访问</span>${icon('arrowUpRight')}</a>
  </div>
</article>`;
}

function renderIndex() {
  const latestChecked = communities.reduce((latest, item) => item.last_checked > latest ? item.last_checked : latest, '');
  const spectrum = communitiesByCategory.map(({ id, short_name: shortName, items }) => `<span data-category="${escapeHtml(id)}" style="--weight:${items.length}" title="${escapeHtml(shortName)}：${items.length} 个"><i></i></span>`).join('');
  const categoryFilters = categories.map(({ id, short_name: shortName }) => `<button type="button" data-category-filter="${escapeHtml(id)}" aria-pressed="false">${escapeHtml(shortName)}</button>`).join('');

  const sections = communitiesByCategory.map(({ id, name, description, items }) => `<section class="category-section" id="${escapeHtml(id)}" data-category-section data-category="${escapeHtml(id)}">
  <header class="category-heading">
    <div>
      <p><span class="category-dot" aria-hidden="true"></span>主题分类</p>
      <h2>${escapeHtml(name)}</h2>
      <div>${escapeHtml(description)}</div>
    </div>
    <span class="section-count"><strong data-section-count>${items.length}</strong> 个</span>
  </header>
  <div class="community-list">${items.map(renderCommunityRow).join('\n')}</div>
</section>`).join('\n');

  return renderShell({
    title: 'Small Forums List',
    description: '国内外小型、圈内、传统论坛和隐藏社区入口目录，支持主题、语言和关键词筛选。',
    pageClass: 'page-home',
    body: `    <section class="directory-intro" id="directory" aria-labelledby="page-title">
      <div class="intro-copy">
        <p class="kicker"><span aria-hidden="true"></span>Beyond algorithmic feeds</p>
        <h1 id="page-title">小众社区目录</h1>
        <p>收集不主动搜索就很难遇到的论坛与独立社区。按公开页面和社区资料整理入口、氛围、注册方式与风险，不把收录当作推荐。</p>
        <div class="directory-stats" aria-label="目录统计">
          <span><strong>${communities.length}</strong> 社区</span>
          <span><strong>${categories.length}</strong> 分类</span>
          <span>更新至 <strong>${escapeHtml(latestChecked)}</strong></span>
        </div>
      </div>
      <div class="category-spectrum" aria-label="各分类社区数量分布">
        <p>目录分布</p>
        <div>${spectrum}</div>
        <small>色块宽度代表各主题当前收录量</small>
      </div>
    </section>

    <section class="directory-toolbar" aria-label="目录筛选">
      <label class="directory-search">
        <span class="sr-only">搜索社区</span>
        ${icon('search')}
        <input type="search" data-directory-search placeholder="搜索名称、别名、标签或社区氛围" autocomplete="off">
        <button type="button" class="input-clear" data-directory-search-clear aria-label="清除搜索" title="清除搜索" hidden>${icon('x')}</button>
      </label>
      <div class="filter-row">
        <span class="filter-label">主题</span>
        <div class="segmented-scroll">
          <div class="segmented-control" role="group" aria-label="按主题筛选">
            <button type="button" data-category-filter="all" aria-pressed="true">全部</button>${categoryFilters}
          </div>
        </div>
      </div>
      <div class="filter-row compact-filter-row">
        <span class="filter-label">语言</span>
        <div class="segmented-control language-control" role="group" aria-label="按语言筛选">
          <button type="button" data-language-filter="all" aria-pressed="true">全部</button>
          <button type="button" data-language-filter="zh" aria-pressed="false">中文</button>
          <button type="button" data-language-filter="en" aria-pressed="false">English</button>
          <button type="button" data-language-filter="ja" aria-pressed="false">日本語</button>
        </div>
      </div>
    </section>

    <div class="results-summary">
      <p data-result-count aria-live="polite">显示全部 ${communities.length} 个社区</p>
      <button type="button" class="text-button" data-reset-filters hidden>清除筛选</button>
    </div>

    <section class="empty-state" data-empty-state hidden aria-labelledby="empty-title">
      ${icon('search')}
      <h2 id="empty-title">没有匹配的社区</h2>
      <p>换一个关键词，或清除主题与语言筛选。</p>
      <button type="button" class="command-button" data-reset-filters>清除筛选</button>
    </section>

    <div class="directory-results" data-directory-results>${sections}</div>`
  });
}

function renderTokens(values, className = '') {
  return (values || []).map((value) => `<span class="fact-token${className ? ` ${className}` : ''}">${escapeHtml(value)}</span>`).join('');
}

function renderFactRow(label, content) {
  if (!content) return '';
  return `<div class="fact-row"><dt>${escapeHtml(label)}</dt><dd>${content}</dd></div>`;
}

function sourceLabel(source) {
  try {
    const url = new URL(source);
    const pathLabel = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.hostname}${pathLabel}`;
  } catch {
    return source;
  }
}

function renderGiscus(item) {
  return `<section class="comments" aria-labelledby="comments-title">
  <div class="comments-heading">
    <p>GitHub Discussions</p>
    <h2 id="comments-title">补充社区体验</h2>
    <div>欢迎修正 ${escapeHtml(item.name)} 的注册状态、氛围和分类。请避免发布隐私、交易引流或具体灰区操作路径。</div>
  </div>
  <div class="giscus-wrap">
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
  </div>
</section>`;
}

function renderCommunityPage(item) {
  const category = categoryMap[item.category];
  const sources = (item.sources || []).map((source) => `<li><a href="${escapeHtml(source)}" target="_blank" rel="noreferrer"><span>${escapeHtml(sourceLabel(source))}</span>${icon('arrowUpRight')}</a></li>`).join('\n');
  const facts = [
    renderFactRow('语言', renderTokens(displayLanguages(item.language), 'language-fact')),
    renderFactRow('别名', item.aliases?.length ? escapeHtml(item.aliases.join('、')) : ''),
    renderFactRow('标签', renderTokens(item.tags)),
    renderFactRow('注意标签', item.risks?.length ? renderTokens(item.risks, 'risk-fact') : ''),
    renderFactRow('最后核验', `<time datetime="${escapeHtml(item.last_checked)}">${escapeHtml(item.last_checked)}</time>`)
  ].join('');

  const body = `    <div class="detail-back"><a href="${homeAnchor(item.category)}">${icon('arrowLeft')}返回 ${escapeHtml(category?.short_name || item.category)}</a></div>
    <article class="community-detail" data-category="${escapeHtml(item.category)}">
      <header class="detail-header">
        <p class="detail-category"><span class="category-dot" aria-hidden="true"></span>${escapeHtml(category?.name || item.category)}</p>
        <h1>${escapeHtml(item.name)}</h1>
        <p>${escapeHtml(item.vibe)}</p>
        <a class="primary-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">访问社区${icon('arrowUpRight')}</a>
      </header>

      <div class="detail-layout">
        <div class="detail-content">
          <section>
            <p class="section-kicker">Access</p>
            <h2>注册方式</h2>
            <p>${escapeHtml(item.registration)}</p>
          </section>
          <section>
            <p class="section-kicker">Why visit</p>
            <h2>适合看什么</h2>
            <p>${escapeHtml(item.benefits)}</p>
          </section>
          <section>
            <p class="section-kicker">Before you go</p>
            <h2>进入前注意</h2>
            <p>${escapeHtml(item.notes)}</p>
          </section>
          <section>
            <p class="section-kicker">Sources</p>
            <h2>公开来源</h2>
            <ul class="source-list">${sources}</ul>
          </section>
        </div>
        <aside class="detail-facts" aria-label="社区资料">
          <h2>资料速览</h2>
          <dl>${facts}</dl>
          <p>信息可能随站点政策变化。注册或下载前，请再次查看官方页面。</p>
        </aside>
      </div>
    </article>
    ${renderGiscus(item)}`;

  return renderShell({
    title: item.name,
    description: `${item.name} 的入口、定位、注册方式、内容类型和注意事项。`,
    canonicalPath: `${siteBase}communities/${item.slug}/`,
    activeCategory: item.category,
    activeSlug: item.slug,
    pageClass: 'page-detail',
    body
  });
}

function writeFile(relativePath, content) {
  const target = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

const categoryToneStyles = categories.map(({ id }, index) => `[data-category="${id}"] { --category-color: var(--category-${index + 1}); }`).join('\n');
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#202524"/>
  <path fill="#f7f8f7" d="M14 15h25v7H21v8h16v7H21v13h-7z"/>
  <rect x="42" y="15" width="8" height="35" fill="#e96b41"/>
</svg>\n`;

ensureCleanDir(outputDir);
writeFile('assets/styles.css', `${fs.readFileSync(path.join(sourceDir, 'styles.css'), 'utf8').trim()}\n\n${categoryToneStyles}\n`);
writeFile('assets/site.js', fs.readFileSync(path.join(sourceDir, 'site.js'), 'utf8'));
writeFile('favicon.svg', favicon);
writeFile('index.html', renderIndex());
for (const community of communities) {
  writeFile(path.join('communities', community.slug, 'index.html'), renderCommunityPage(community));
}
writeFile('communities.json', `${JSON.stringify(communities.map(({ slug, ...item }) => ({ slug, ...item })), null, 2)}\n`);
writeFile('CNAME', 'forums.cc.cd\n');
writeFile('.nojekyll', '');

console.log(`Built ${communities.length} community pages in ${outputDir}`);
