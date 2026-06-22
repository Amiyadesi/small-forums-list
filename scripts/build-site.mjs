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

function renderShell({ title, description, body, canonicalPath = siteBase }) {
  const fullTitle = title === 'Small Forums List' ? title : `${title} - Small Forums List`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${siteOrigin}${canonicalPath}">
  <link rel="stylesheet" href="${siteBase}assets/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${siteBase}">Small Forums List</a>
      <nav class="top-nav" aria-label="主导航">
        <a href="${siteBase}">目录</a>
        <a href="https://github.com/${repo}">GitHub</a>
        <a href="https://github.com/${repo}/discussions">评论区</a>
      </nav>
    </div>
  </header>
  <main class="wrap main-content">
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap">由 <a href="https://github.com/${repo}">${repo}</a> 生成。欢迎提交 PR 修正社区信息。</div>
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
  return `<article class="community-card">
  <div class="card-head">
    <h3><a href="${linkToCommunity(item)}">${escapeHtml(item.name)}</a></h3>
    <span>${escapeHtml(categoryMap[item.category] ?? item.category)}</span>
  </div>
  <p>${escapeHtml(item.vibe)}</p>
  <div class="card-actions">
    <a href="${linkToCommunity(item)}">查看详情</a>
    <a href="${escapeHtml(item.url)}">访问入口</a>
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
    return `<section class="category-section" id="${id}">
  <div class="section-title">
    <h2>${escapeHtml(name)}</h2>
    <span>${items.length} 个</span>
  </div>
  <div class="community-grid">
${items.map(renderCommunityCard).join('\n')}
  </div>
</section>`;
  }).join('\n');

  return renderShell({
    title: 'Small Forums List',
    description: '国内外小型、圈内、传统论坛和隐藏社区入口列表。',
    body: `    <section class="intro">
      <h1>Small Forums List</h1>
      <p>整理国内外小型、圈内、传统论坛和隐藏社区入口。这里的“小型”不是严格按用户量计算，而是指不主动搜索、不混相关领域，基本不会自然刷到的社区。</p>
      <p>目前主要由 AI 按公开信息、站点页面和少量个人体验整理；只有一部分社区是长期进入体验过的。欢迎各社区成员提交 PR，补充真实看法和更准确的注册、氛围、入口信息。</p>
      <div class="stats">
        <span>${communities.length} 个社区</span>
        <span>${categories.length} 个分类</span>
        <span>核验 ${escapeHtml(latestChecked)}</span>
      </div>
    </section>
    <nav class="category-nav" aria-label="分类目录">
${categoryNav}
    </nav>
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
  const body = `    <a class="back-link" href="${siteBase}">返回目录</a>
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
  --bg: #f7f7f4;
  --surface: #ffffff;
  --surface-2: #efeee9;
  --text: #1c1c1a;
  --muted: #67645f;
  --border: #d8d5cd;
  --accent: #1e6b5c;
  --accent-2: #8b3d2e;
  --shadow: 0 12px 32px rgba(28, 28, 26, 0.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #171815;
    --surface: #20211e;
    --surface-2: #2a2b27;
    --text: #f0eee8;
    --muted: #b6b0a6;
    --border: #3e4039;
    --accent: #63c4af;
    --accent-2: #e08f7f;
    --shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
  }
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.65;
}
a { color: inherit; text-decoration-color: color-mix(in srgb, var(--accent), transparent 40%); text-underline-offset: 0.2em; }
a:hover { color: var(--accent); }
.wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg), transparent 12%);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
}
.header-inner { display: flex; align-items: center; justify-content: space-between; min-height: 58px; gap: 16px; }
.brand { font-weight: 760; text-decoration: none; }
.top-nav { display: flex; gap: 14px; flex-wrap: wrap; font-size: 14px; color: var(--muted); }
.top-nav a { text-decoration: none; }
.main-content { padding: 36px 0 56px; }
.intro {
  max-width: 860px;
  padding: 30px 0 22px;
}
.intro h1 { margin: 0 0 14px; font-size: clamp(34px, 5vw, 58px); line-height: 1.06; letter-spacing: 0; }
.intro p { margin: 0 0 12px; color: var(--muted); font-size: 17px; }
.stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.stats span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 4px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
}
.category-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 34px; }
.category-nav a {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
}
.category-nav span { color: var(--muted); }
.category-section { margin: 0 0 42px; scroll-margin-top: 82px; }
.section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
.section-title h2 { margin: 0 0 8px; font-size: 24px; }
.section-title span { color: var(--muted); font-size: 14px; }
.community-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.community-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--shadow);
}
.card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.card-head h3 { margin: 0; font-size: 18px; line-height: 1.25; }
.card-head span { flex: 0 0 auto; max-width: 48%; color: var(--muted); font-size: 12px; text-align: right; }
.community-card p { margin: 0; color: var(--muted); }
.card-actions { display: flex; gap: 12px; margin-top: 12px; font-size: 14px; }
.back-link { display: inline-flex; margin-bottom: 18px; color: var(--muted); }
.detail, .comments {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: clamp(18px, 4vw, 34px);
  box-shadow: var(--shadow);
}
.detail-header { display: grid; grid-template-columns: 1fr auto; gap: 8px 18px; align-items: end; margin-bottom: 22px; }
.detail-header p { grid-column: 1 / -1; margin: 0; color: var(--accent-2); font-size: 14px; }
.detail-header h1 { margin: 0; font-size: clamp(32px, 5vw, 52px); line-height: 1.1; letter-spacing: 0; }
.primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 8px 14px;
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
  margin: 0 0 8px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.meta-list dt { color: var(--muted); }
.meta-list dd { margin: 0; }
.detail section { margin-top: 24px; }
.detail h2, .comments h2 { margin: 0 0 8px; font-size: 20px; }
.detail p, .comments p { margin: 0; color: var(--muted); }
.source-list { margin: 0; padding-left: 20px; overflow-wrap: anywhere; }
.comments { margin-top: 20px; }
.site-footer { border-top: 1px solid var(--border); padding: 22px 0 34px; color: var(--muted); font-size: 14px; }
@media (max-width: 760px) {
  .wrap { width: min(100% - 24px, 1120px); }
  .header-inner { align-items: flex-start; flex-direction: column; padding: 12px 0; }
  .community-grid { grid-template-columns: 1fr; }
  .detail-header { grid-template-columns: 1fr; }
  .primary-link { width: 100%; }
  .meta-list { grid-template-columns: 1fr; gap: 2px; }
  .card-head { align-items: flex-start; flex-direction: column; }
  .card-head span { max-width: none; text-align: left; }
}`;

ensureCleanDir(outputDir);
writeFile('assets/styles.css', styles);
writeFile('index.html', renderIndex());
for (const community of communities) {
  writeFile(path.join('communities', community.slug, 'index.html'), renderCommunityPage(community));
}
writeFile('communities.json', JSON.stringify(communities.map(({ slug, ...item }) => ({ slug, ...item })), null, 2) + '\n');
writeFile('CNAME', 'forums.cc.cd\n');
writeFile('.nojekyll', '');

console.log(`Built ${communities.length} community pages in ${outputDir}`);
