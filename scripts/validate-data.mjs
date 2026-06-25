import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const dataPath = path.join(repoRoot, 'data', 'communities.json');

const categories = new Set([
  'tech_ai_dev',
  'host_webmaster',
  'search_resource_tools',
  'security_system_software',
  'acg_game_niche',
  'hardware_homelab',
  'adult_resource_gray',
  'overseas_old_forum'
]);

const requiredStringFields = [
  'name',
  'url',
  'category',
  'registration',
  'vibe',
  'benefits',
  'notes',
  'last_checked'
];

const requiredArrayFields = [
  'aliases',
  'language',
  'tags',
  'risks',
  'sources'
];

function pushIssue(issues, index, name, message) {
  const label = name || `<entry ${index + 1}>`;
  issues.push(`${label}: ${message}`);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function readCommunities() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read ${path.relative(repoRoot, dataPath)}: ${error.message}`);
  }
}

const communities = readCommunities();
const issues = [];

if (!Array.isArray(communities)) {
  issues.push('data/communities.json must contain a JSON array.');
} else {
  const names = new Map();
  const urls = new Map();

  communities.forEach((item, index) => {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      pushIssue(issues, index, '', 'entry must be an object');
      return;
    }

    for (const field of requiredStringFields) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        pushIssue(issues, index, name, `${field} must be a non-empty string`);
      }
    }

    for (const field of requiredArrayFields) {
      if (!Array.isArray(item[field])) {
        pushIssue(issues, index, name, `${field} must be an array`);
      }
    }

    if (name) {
      if (names.has(name)) {
        pushIssue(issues, index, name, `duplicate name, first seen at entry ${names.get(name) + 1}`);
      } else {
        names.set(name, index);
      }
    }

    if (typeof item.url === 'string' && item.url.trim()) {
      if (!isHttpUrl(item.url)) {
        pushIssue(issues, index, name, 'url must be an absolute http(s) URL');
      } else if (urls.has(item.url)) {
        pushIssue(issues, index, name, `duplicate url, first seen at entry ${urls.get(item.url) + 1}`);
      } else {
        urls.set(item.url, index);
      }
    }

    if (typeof item.category === 'string' && !categories.has(item.category)) {
      pushIssue(issues, index, name, `category must be one of: ${[...categories].join(', ')}`);
    }

    if (Array.isArray(item.sources)) {
      if (item.sources.length === 0) {
        pushIssue(issues, index, name, 'sources must include at least one source URL');
      }
      item.sources.forEach((source, sourceIndex) => {
        if (typeof source !== 'string' || !isHttpUrl(source)) {
          pushIssue(issues, index, name, `sources[${sourceIndex}] must be an absolute http(s) URL`);
        }
      });
    }

    if (typeof item.last_checked === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(item.last_checked)) {
      pushIssue(issues, index, name, 'last_checked must use YYYY-MM-DD');
    }

    if (Array.isArray(item.language) && item.language.length === 0) {
      pushIssue(issues, index, name, 'language must include at least one language code');
    }

    if (Array.isArray(item.tags) && item.tags.length === 0) {
      pushIssue(issues, index, name, 'tags must include at least one tag');
    }
  });
}

if (issues.length) {
  console.error(`Found ${issues.length} data issue${issues.length === 1 ? '' : 's'}:`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Validated ${communities.length} communities.`);
