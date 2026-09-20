#!/usr/bin/env node
// Reusable, non-evasive starting point for public-record indexes. It accepts a
// saved official HTML file as well as an ordinary public URL and stops on any
// access-control response. Site-specific extraction remains explicit so a
// layout change cannot silently corrupt published data.
import { readSource, normalizeWhitespace, sourceManifest } from './lib/public-record-utils.mjs';

const location = process.argv[2];
if (!location) throw new Error('Usage: node scripts/index-public-records.mjs <saved-html-or-public-url>');
const body = await readSource(location);
const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) =>
  [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
    normalizeWhitespace(cell[1].replace(/<[^>]+>/g, ' ')),
  ),
).filter((row) => row.some(Boolean));
console.log(JSON.stringify({ manifest: sourceManifest({ url: location, body, parser: 'generic-html-table-v1' }), rows }, null, 2));
