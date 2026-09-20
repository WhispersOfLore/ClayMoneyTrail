import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const skipped = new Set(['.git', 'node_modules', '.vinext', 'dist', 'dist-pages', 'coverage']);
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(relative('.', path));
  }
};
walk('.');
const pattern = /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,})/i;
const hits = [];
for (const file of files) {
  if (/\.(?:jpg|jpeg|png|gif|ico|pdf)$/i.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (pattern.test(text)) hits.push(file);
}
if (hits.length) {
  console.error(`Potential secrets found in: ${hits.join(', ')}`);
  process.exitCode = 1;
} else console.log(`Secrets scan passed: ${files.length} tracked files checked.`);
