#!/usr/bin/env node
// Provenance step for any public-records response delivered as a ZIP.
// Read-only: the archive is hashed and its entries are inventoried in memory
// (nothing is extracted or modified). Prints a JSON manifest that records the
// archive hash, per-file hashes, ZIP CRC verification, formats, and any
// byte-identical duplicate files, so every later published number can be tied
// back to an exact, checksummed original.
//
// Usage: node scripts/records-response-manifest.mjs <response.zip> [output.json]
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { readZipEntries } from './lib/zip-reader.mjs';

const [zipPath, outPath] = process.argv.slice(2);
if (!zipPath) throw new Error('Usage: node scripts/records-response-manifest.mjs <response.zip> [output.json]');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const archive = readFileSync(zipPath);
const entries = [...readZipEntries(archive)].map(([name, entry]) => {
  const body = entry.read();
  return {
    name,
    bytes: body.length,
    sha256: sha256(body),
    zipCrc32: entry.crc32.toString(16).padStart(8, '0'),
    zipCrcVerified: entry.crcOk(),
    format: extname(name).slice(1).toLowerCase() || 'none',
  };
});

const byHash = Map.groupBy(entries, (entry) => entry.sha256);
const manifest = {
  archive: { file: basename(zipPath), bytes: archive.length, sha256: sha256(archive), modified: statSync(zipPath).mtime.toISOString() },
  entryCount: entries.length,
  formats: Object.fromEntries(Map.groupBy(entries, (entry) => entry.format).entries().map(([format, list]) => [format, list.length])),
  allCrcVerified: entries.every((entry) => entry.zipCrcVerified),
  duplicateFiles: [...byHash.values()].filter((group) => group.length > 1).map((group) => group.map((entry) => entry.name)),
  entries,
};

const json = `${JSON.stringify(manifest, null, 2)}\n`;
if (outPath) writeFileSync(outPath, json);
else process.stdout.write(json);
