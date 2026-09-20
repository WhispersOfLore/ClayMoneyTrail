import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();
export const stableId = (...parts) => parts.map(normalizeWhitespace).join('|').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const checksum = (body) => createHash('sha256').update(body).digest('hex');

export async function readSource(location) {
  if (!/^https?:/i.test(location)) return readFile(location, 'utf8');
  const response = await fetch(location, { headers: { 'user-agent': 'ClayMoneyTrail/1.0 public-record research' } });
  if (!response.ok) throw new Error(`Official source returned ${response.status}; stopping without attempting to bypass access controls.`);
  return response.text();
}

export async function writeGenerated(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function sourceManifest({ url, body, parser, retrievedAt = new Date().toISOString() }) {
  return { url, retrievedAt, parser, sha256: checksum(body) };
}
