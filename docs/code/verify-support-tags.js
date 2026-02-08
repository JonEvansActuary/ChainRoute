#!/usr/bin/env node
/**
 * Verify that all Arweave support-file transactions have the ChainRoute-Genesis tag set to the chain genesis hash.
 * Reads chain-manifest.json and each eventN-supports.json, queries Arweave GraphQL for each tx's tags, and checks the tag.
 *
 * Usage:
 *   node verify-support-tags.js <path-to-chain-manifest.json> [--gateway https://arweave.net]
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_GATEWAY = 'https://arweave.net';

function resolvePath(manifestPath, relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(path.dirname(manifestPath), relativePath);
}

function normalizeTag(t) {
  return { name: String(t.name || ''), value: String(t.value || '') };
}

async function getTransactionTags(txId, graphqlUrl) {
  const query = `
    query {
      transactions(ids: ["${txId}"], first: 1) {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;
  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  const edges = json?.data?.transactions?.edges;
  if (!edges || edges.length === 0) {
    throw new Error('Transaction not found');
  }
  const node = edges[0].node;
  const rawTags = node.tags || [];
  return rawTags.map(normalizeTag);
}

async function main() {
  const args = process.argv.slice(2);
  let manifestPath = args[0];
  let gateway = DEFAULT_GATEWAY;
  const gwIdx = args.indexOf('--gateway');
  if (gwIdx !== -1 && args[gwIdx + 1]) {
    gateway = args[gwIdx + 1];
  }
  const graphqlUrl = gateway.replace(/\/$/, '') + '/graphql';

  if (!manifestPath) {
    console.error('Usage: node verify-support-tags.js <path-to-chain-manifest.json> [--gateway https://arweave.net]');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(manifestPath) ? manifestPath : path.resolve(process.cwd(), manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read manifest:', e.message);
    process.exit(1);
  }

  const genesisHash = manifest.genesisHash.toLowerCase();
  const supportsByFile = [];

  for (const entry of manifest.arweaveBlobs) {
    const supportsPath = resolvePath(resolvedPath, entry.supportsFile);
    let supports;
    try {
      supports = JSON.parse(fs.readFileSync(supportsPath, 'utf8'));
    } catch (e) {
      console.error(`Failed to read ${entry.supportsFile}:`, e.message);
      process.exit(1);
    }
    supportsByFile.push({ step: entry.step, supports, file: entry.supportsFile });
  }

  const errors = [];
  let checked = 0;
  let ok = 0;

  console.log('Checking ChainRoute-Genesis tag on support-file transactions...\n');

  for (const { step, supports, file } of supportsByFile) {
    for (const s of supports) {
      const txId = s.id;
      const label = s.label || txId.slice(0, 12) + '...';
      checked++;
      try {
        const tags = await getTransactionTags(txId, graphqlUrl);
        const genesisTag = tags.find((t) => t.name === 'ChainRoute-Genesis');
        const tagValue = genesisTag ? genesisTag.value.toLowerCase() : '';
        if (!genesisTag || tagValue !== genesisHash) {
          errors.push(`[${step}] ${file} ${label} (${txId}): missing or wrong ChainRoute-Genesis tag (got: ${tagValue || '(none)'})`);
        } else {
          ok++;
        }
      } catch (e) {
        errors.push(`[${step}] ${file} ${label} (${txId}): ${e.message}`);
      }
    }
  }

  console.log(`Checked ${checked} support transactions; ${ok} have correct ChainRoute-Genesis tag.\n`);

  if (errors.length > 0) {
    console.log('--- Errors ---');
    errors.forEach((e) => console.log(' ', e));
    process.exit(1);
  }

  console.log('All support files have the correct genesis tag.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
