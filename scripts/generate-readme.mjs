import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const dataPath = path.join(repoRoot, 'data', 'communities.json');
const communities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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

const categoryNames = Object.fromEntries(categories);

function escapeMarkdownText(value) {
  return String(value).replace(/\|/g, '\\|');
}

function displayList(values) {
  return values && values.length ? values.join(', ') : '无';
}

function itemToMarkdown(item) {
  const lines = [`### ${item.name}`, ''];
  lines.push(`- 入口：${item.url}`);
  lines.push(`- 定位/氛围：${item.vibe}`);
  lines.push(`- 注册：${item.registration}`);
  lines.push(`- 适合看/里面有什么：${item.benefits}`);
  lines.push(`- 注意：${item.notes}`);
  if (item.sources && item.sources.length) lines.push(`- 来源：${item.sources.join('、')}`);
  lines.push(`- 核验：${item.last_checked}`);
  return lines.join('\n');
}

const latestChecked = communities.reduce((latest, item) => item.last_checked > latest ? item.last_checked : latest, '');
const summaryRows = categories.map(([id, name]) => {
  const names = communities.filter((item) => item.category === id).map((item) => item.name).join(', ');
  return `| ${name} | ${escapeMarkdownText(names)} |`;
});

const body = [
  '# Small Forums List',
  '',
  '一个整理国内外小型、圈内、传统论坛和隐藏社区入口的列表。',
  '',
  '这里的“小型”不是严格按用户量计算，而是指：如果你不主动搜索、不混相关领域，基本不会自然刷到的社区。它们可能是技术论坛、主机圈、ACG 小圈子、站长生态、硬件论坛、成人/资源向灰区社区，也可能是海外老互联网论坛。',
  '',
  '## 说明',
  '',
  '- 目前主要由 AI 按公开信息、站点页面和少量个人体验整理；只有一部分社区是我真实长期进入体验过的。',
  '- 欢迎各社区成员提交 PR，修正入口、分类、注册方式，或者补充你对社区氛围和真实体验的看法。',
  '- 收录不是推荐、背书或导流，只是做互联网社区地图。',
  '- 成人、资源、破解、逆向、安全、刷机、交易等内容会按大类写清楚，但不写具体操作路径。',
  '- 未长期使用过的社区，会尽量写成公开信息和圈内观察，不假装成亲身体验。',
  '',
  '## 在线页面',
  '',
  '- GitHub 仓库：https://github.com/Amiyadesi/small-forums-list',
  '- GitHub Pages：https://forums.cc.cd/',
  '- 每个社区会生成独立页面，并在页面底部使用 Giscus 接 GitHub Discussions 评论。',
  '',
  '## 数据文件',
  '',
  '- [`data/communities.json`](data/communities.json)：结构化条目，适合后续生成网站或表格。',
  '- [`docs/categories.md`](docs/categories.md)：分类、收录边界和维护规则。',
  '',
  `首版共收录 ${communities.length} 个社区，最后人工核验日期统一为 \`${latestChecked}\`。`,
  '',
  '## 分类速览',
  '',
  '| 分类 | 社区 |',
  '| --- | --- |',
  ...summaryRows,
  '',
  ...categories.flatMap(([id, name]) => {
    const items = communities.filter((item) => item.category === id);
    if (!items.length) return [];
    const intro = id === 'adult_resource_gray'
      ? ['这一类只作为社区形态观察。会写里面常见的内容类型、18+ 属性和可能混杂的灰色内容，但不要把这里当成推荐列表。', '']
      : [];
    return [`## ${name}`, '', ...intro, ...items.flatMap((item, index) => [itemToMarkdown(item), ...(index === items.length - 1 ? [] : [''])]), ''];
  }),
  '## 贡献方式',
  '',
  '新增社区时请同时更新：',
  '',
  '1. `data/communities.json`',
  '2. 运行 `node scripts/generate-readme.mjs` 同步 README',
  '3. 必要时更新 `docs/categories.md`',
  '4. 运行 `node scripts/build-site.mjs` 预览生成页面',
  '',
  '条目描述尽量写清楚：入口、社区氛围、主要内容、注册门槛、价值、注意事项、来源和核验日期。灰区社区可以写内容类型，但不要写操作教程、交易路径或绕过方法。',
  ''
].join('\n');

fs.writeFileSync(path.join(repoRoot, 'README.md'), body);
