#!/usr/bin/env node
/**
 * Post a single supporting file to Arweave (e.g. image, PDF). Optionally tag with
 * genesis hash per ChainRoute protocol. Returns the Arweave transaction ID.
 *
 * Requires: npm install arweave
 * Wallet: ARWEAVE_KEY_PATH or --key <path>
 *
 * Usage:
 *   node post-support-to-arweave.js <file-path> [--genesis <64-hex>] [--key path/to/key.json]
 */

const fs = require('fs');
const path = require('path');
const { postDataToArweave } = require('./arweave-post.js');

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;

/**
 * Post a file to Arweave and return the transaction ID.
 * @param {string} filePath - Path to file to upload
 * @param {string} keyPath - Path to JWK key file
 * @param {object} [opts] - { genesis (64 hex), host, port, protocol }
 * @returns {Promise<string>} Arweave transaction ID
 */
async function postSupportToArweave(filePath, keyPath, opts = {}) {
  const data = fs.readFileSync(path.resolve(filePath));
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.pdf': 'application/pdf', '.json': 'application/json', '.txt': 'text/plain' };
  const tags = [['Content-Type', contentTypes[ext] || 'application/octet-stream']];
  if (opts.genesis && GENESIS_PATTERN.test(opts.genesis)) {
    tags.push(['ChainRoute-Genesis', opts.genesis.toLowerCase()]);
  }
  return postDataToArweave(data, keyPath, tags, opts);
}

async function main() {
  const args = process.argv.slice(2);
  let keyPath = process.env.ARWEAVE_KEY_PATH;
  let genesis;
  const keyIdx = args.indexOf('--key');
  if (keyIdx !== -1 && args[keyIdx + 1]) {
    keyPath = args[keyIdx + 1];
    args.splice(keyIdx, 2);
  }
  const genesisIdx = args.indexOf('--genesis');
  if (genesisIdx !== -1 && args[genesisIdx + 1]) {
    genesis = args[genesisIdx + 1];
    args.splice(genesisIdx, 2);
  }
  const hostIdx = args.indexOf('--host');
  const opts = {};
  if (hostIdx !== -1 && args[hostIdx + 1]) {
    opts.host = args[hostIdx + 1];
    args.splice(hostIdx, 2);
  }
  const [filePath] = args;

  if (!filePath) {
    console.error('Usage: node post-support-to-arweave.js <file-path> [--genesis <64-hex>] [--key path/to/key.json]');
    process.exit(1);
  }
  if (!keyPath) {
    console.error('Error: Set ARWEAVE_KEY_PATH or pass --key <path-to-JWK.json>');
    process.exit(1);
  }

  try {
    const txId = await postSupportToArweave(filePath, keyPath, { genesis, ...opts });
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

module.exports = { postSupportToArweave };
