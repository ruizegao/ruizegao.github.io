// Loads the YAML files in src/data and provides a tiny inline-Markdown
// renderer, so content files never need HTML.
import fs from 'node:fs';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';

const dataDir = path.resolve('src/data');

export function load(name) {
  const text = fs.readFileSync(path.join(dataDir, `${name}.yaml`), 'utf8');
  return parseYaml(text) ?? [];
}

const escape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Supports [text](url), *italic* and **bold**. Everything else is escaped.
export function inline(md) {
  return escape(md)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const external = /^https?:/.test(url);
      return `<a href="${url}"${external ? ' rel="noopener"' : ''}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// "you@sfu.ca" → "you [at] sfu [dot] ca"
export function obfuscate(email) {
  return email.replace('@', ' [at] ').replace(/\./g, ' [dot] ');
}

export function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
