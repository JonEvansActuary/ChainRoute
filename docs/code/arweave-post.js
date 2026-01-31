/**
 * Shared helper: post data to Arweave and return the transaction ID.
 * Used by post-support-to-arweave.js and post-provenance-blob-to-arweave.js.
 */

const fs = require('fs');
const path = require('path');

/**
 * Post data to Arweave (sign + chunked upload) and return the transaction ID.
 * @param {Buffer} data - Raw data to post
 * @param {string} keyPath - Path to JWK key file
 * @param {Array<[string, string]>} tags - Array of [name, value] for tx.addTag(name, value)
 * @param {object} [opts] - { host, port, protocol }
 * @returns {Promise<string>} Arweave transaction ID
 */
async function postDataToArweave(data, keyPath, tags = [], opts = {}) {
  const Arweave = require('arweave');
  const key = JSON.parse(fs.readFileSync(path.resolve(keyPath), 'utf8'));
  const arweave = Arweave.init({
    host: opts.host || 'arweave.net',
    port: opts.port || 443,
    protocol: opts.protocol || 'https',
  });

  const tx = await arweave.createTransaction({ data });
  for (const [name, value] of tags) {
    tx.addTag(name, value);
  }
  await arweave.transactions.sign(tx, key);

  const uploader = await arweave.transactions.getUploader(tx);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
  }

  return tx.id;
}

module.exports = { postDataToArweave };
