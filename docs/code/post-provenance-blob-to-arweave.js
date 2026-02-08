#!/usr/bin/env node
/**
 * Build the ChainRoute provenance event blob (genesis + eventType + timestamp + summary
 * + list of Arweave IDs of supporting files), post it to Arweave, and return the
 * transaction ID. That ID is then used in the Polygon anchor tx.
 *
 * Supports come from --supports file, or from event file's "supports" key if omitted.
 *
 * Requires: npm install arweave
 * Wallet: ARWEAVE_KEY_PATH or --key <path>
 *
 * Usage:
 *   node post-provenance-blob-to-arweave.js <genesis-hash> <event-file.json> [--supports supports.json] [--key path/to/key.json]
 *
 * event-file.json: { "eventType", "timestamp"?, "summary", "supports"? } (timestamp defaults to now; supports optional)
 * supports.json: [ { "id": "<arweave-tx-id>", "label": "photo" }, ... ] (IDs from post-support-to-arweave.js)
 */

const fs = require('fs');
const path = require('path');
const { postDataToArweave } = require('./arweave-post.js');
const { validateBlob } = require('./validate-arweave-blob.js');

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;

/**
 * Build the provenance blob: genesis + event metadata + supports (Arweave IDs of supporting files).
 * @param {string} genesisHash - 64 hex (Polygon genesis tx hash)
 * @param {object} event - { eventType, timestamp?, summary }
 * @param {Array<{ id: string, label?: string }>} [supports] - Arweave tx IDs (and optional labels) from supporting file posts
 * @returns {object} Blob ready for Arweave
 */
function buildProvenanceBlob(genesisHash, event, supports = []) {
  if (!GENESIS_PATTERN.test(genesisHash)) {
    throw new Error('genesis hash must be 64 hex characters');
  }
  const blob = {
    genesis: genesisHash.toLowerCase(),
    eventType: event.eventType,
    timestamp: event.timestamp || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    summary: event.summary,
  };
  if (supports.length > 0) {
    blob.supports = supports.map((s) => (s.label != null ? { id: s.id, label: s.label } : { id: s.id }));
  }
  return blob;
}

/**
 * Post a provenance blob to Arweave and return the transaction ID.
 * @param {object} blob - ChainRoute provenance blob
 * @param {string} keyPath - Path to JWK key file
 * @param {object} [opts] - { host, port, protocol }
 * @returns {Promise<string>} Arweave transaction ID
 */
async function postProvenanceBlobToArweave(blob, keyPath, opts = {}) {
  const data = Buffer.from(JSON.stringify(blob), 'utf8');
  return postDataToArweave(data, keyPath, [['Content-Type', 'application/json']], opts);
}

function resolvePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

async function main() {
  const args = process.argv.slice(2);
  let keyPath = process.env.ARWEAVE_KEY_PATH;
  let supportsPath;
  const keyIdx = args.indexOf('--key');
  if (keyIdx !== -1 && args[keyIdx + 1]) {
    keyPath = args[keyIdx + 1];
    args.splice(keyIdx, 2);
  }
  const supportsIdx = args.indexOf('--supports');
  if (supportsIdx !== -1 && args[supportsIdx + 1]) {
    supportsPath = args[supportsIdx + 1];
    args.splice(supportsIdx, 2);
  }
  const [genesisHash, eventPath] = args;

  if (!genesisHash || !eventPath) {
    console.error('Usage: node post-provenance-blob-to-arweave.js <genesis-hash> <event-file.json> [--supports supports.json] [--key path/to/key.json]');
    process.exit(1);
  }
  if (!keyPath) {
    console.error('Error: Set ARWEAVE_KEY_PATH or pass --key <path-to-JWK.json>');
    process.exit(1);
  }

  let event;
  try {
    event = JSON.parse(fs.readFileSync(resolvePath(eventPath), 'utf8'));
  } catch (e) {
    console.error('Failed to read event file:', e.message);
    process.exit(1);
  }

  let supports = [];
  if (supportsPath) {
    try {
      supports = JSON.parse(fs.readFileSync(resolvePath(supportsPath), 'utf8'));
      if (!Array.isArray(supports)) {
        throw new Error('supports file must be a JSON array of { id, label? }');
      }
    } catch (e) {
      console.error('Failed to read supports file:', e.message);
      process.exit(1);
    }
  } else if (Array.isArray(event.supports) && event.supports.length > 0) {
    supports = event.supports;
  }

  let blob;
  try {
    blob = buildProvenanceBlob(genesisHash, event, supports);
  } catch (e) {
    console.error('Invalid input:', e.message);
    process.exit(1);
  }

  const validation = validateBlob(blob);
  if (!validation.valid) {
    validation.errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  try {
    const txId = await postProvenanceBlobToArweave(blob, keyPath);
    console.log(txId);
  } catch (e) {
    console.error('Post to Arweave failed:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { buildProvenanceBlob, postProvenanceBlobToArweave };
