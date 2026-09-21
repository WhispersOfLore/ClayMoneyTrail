// Dependency-free ZIP reader (Node built-ins only). Reads the central
// directory and returns each entry lazily so a caller can hash or parse a
// file straight out of the archive without extracting anything to disk —
// original records responses are never modified or unpacked in place.
import { inflateRawSync, crc32 } from 'node:zlib';

/**
 * @returns {Map<string, { size: number, crc32: number, read: () => Buffer, crcOk: () => boolean }>}
 */
export function readZipEntries(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Not a ZIP file: end-of-central-directory record not found.');
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Corrupt ZIP central directory.');
    const method = buffer.readUInt16LE(offset + 10);
    const expectedCrc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported ZIP compression method ${method} for ${name}.`);
    const read = () => (method === 0 ? raw : inflateRawSync(raw));
    entries.set(name, { size, crc32: expectedCrc, read, crcOk: () => crc32(read()) === expectedCrc });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
