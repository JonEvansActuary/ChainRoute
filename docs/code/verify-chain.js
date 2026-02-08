#!/usr/bin/env node
/**
 * Verify a ChainRoute chain: Polygon anchors (genesis/prev/blob/delegate) and Arweave blobs (genesis + supports).
 * Reads a chain-manifest.json (expected values) and checks on-chain / on-Arweave data.
 *
 * Usage:
 *   node verify-chain.js <path-to-chain-manifest.json> [--rpc <polygon-rpc>] [--arweave-gateway <url>]
 *
 * Example (from repo root):
 *   node docs/code/verify-chain.js docs/examples/HypotheticalPainting/chain-manifest.json
 */

const fs = require('fs');
const path = require('path');
const { decodePayload } = require('./build-polygon-payload.js');

const DEFAULT_RPC = 'https://polygon-bor-rpc.publicnode.com';
const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';

function resolvePath(manifestPath, relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(path.dirname(manifestPath), relativePath);
}

async function verifyPolygonAnchors(manifest, rpcUrl) {
  const ethers = require('ethers');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const genesisHash = manifest.genesisHash.toLowerCase();
  const errors = [];
  const results = [];

  const ZERO_64 = '0000000000000000000000000000000000000000000000000000000000000000';

  for (const anchor of manifest.polygonAnchors) {
    const step = anchor.step;
    const isGenesis = step === 'genesis';
    // Genesis tx is posted first, so it has no genesis hash to reference yet; the chain's genesis hash is this tx's hash. Payload uses 32 zero bytes.
    const expectedGenesisInPayload = isGenesis ? ZERO_64 : genesisHash;
    const expectedPrev = anchor.prevHash.toLowerCase();
    const expectedDelegate = anchor.delegate.toLowerCase();
    const expectedBlobId = anchor.arweaveBlobId == null ? '' : anchor.arweaveBlobId;

    let tx;
    try {
      tx = await provider.getTransaction(anchor.txHash);
    } catch (e) {
      errors.push(`[${step}] Failed to fetch tx: ${e.message}`);
      results.push({ step, ok: false });
      continue;
    }

    if (!tx || !tx.data || tx.data === '0x') {
      errors.push(`[${step}] Tx missing or no data`);
      results.push({ step, ok: false });
      continue;
    }

    let decoded;
    try {
      decoded = decodePayload(tx.data);
    } catch (e) {
      errors.push(`[${step}] Decode payload failed: ${e.message}`);
      results.push({ step, ok: false });
      continue;
    }

    const gotGenesis = decoded.genesisHash.toLowerCase();
    const gotPrev = decoded.previousPolygonHash.toLowerCase();
    const gotBlobId = decoded.arweaveId;
    const gotDelegate = decoded.delegate.toLowerCase();

    const mismatches = [];
    if (gotGenesis !== expectedGenesisInPayload) {
      mismatches.push(`genesisInPayload: expected ${expectedGenesisInPayload.slice(0, 16)}..., got ${gotGenesis.slice(0, 16)}...`);
    }
    if (gotPrev !== expectedPrev) {
      mismatches.push(`prevHash: expected ${expectedPrev.slice(0, 16)}..., got ${gotPrev.slice(0, 16)}...`);
    }
    if (gotBlobId !== expectedBlobId) {
      mismatches.push(`arweaveBlobId: expected "${expectedBlobId}", got "${gotBlobId}"`);
    }
    if (gotDelegate !== expectedDelegate) {
      mismatches.push(`delegate: expected ${expectedDelegate}, got ${gotDelegate}`);
    }

    if (mismatches.length > 0) {
      errors.push(`[${step}] ${mismatches.join('; ')}`);
      results.push({ step, ok: false, decoded });
    } else {
      results.push({ step, ok: true });
    }
  }

  return { errors, results };
}

async function verifyArweaveBlobs(manifest, manifestPath, gatewayUrl) {
  const genesisHash = manifest.genesisHash.toLowerCase();
  const errors = [];
  const results = [];

  for (const entry of manifest.arweaveBlobs) {
    const step = entry.step;
    const blobId = entry.blobId;
    const supportsPath = resolvePath(manifestPath, entry.supportsFile);

    let expectedSupports;
    try {
      expectedSupports = JSON.parse(fs.readFileSync(supportsPath, 'utf8'));
      if (!Array.isArray(expectedSupports)) {
        throw new Error('supports file must be JSON array');
      }
    } catch (e) {
      errors.push(`[${step}] Failed to read supports file ${entry.supportsFile}: ${e.message}`);
      results.push({ step, ok: false });
      continue;
    }

    const expectedIds = expectedSupports.map((s) => s.id).sort();

    let blobJson;
    try {
      const url = `${gatewayUrl.replace(/\/$/, '')}/${blobId}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      blobJson = await res.json();
    } catch (e) {
      errors.push(`[${step}] Failed to fetch blob ${blobId}: ${e.message}`);
      results.push({ step, ok: false });
      continue;
    }

    const gotGenesis = (blobJson.genesis || '').toLowerCase();
    const gotSupports = blobJson.supports || [];
    const gotIds = gotSupports.map((s) => s.id).sort();

    const mismatches = [];
    if (gotGenesis !== genesisHash) {
      mismatches.push(`genesis: expected ${genesisHash.slice(0, 16)}..., got ${gotGenesis.slice(0, 16)}...`);
    }
    if (gotIds.length !== expectedIds.length || gotIds.some((id, i) => id !== expectedIds[i])) {
      mismatches.push(`supports: expected ${expectedIds.length} ids from ${entry.supportsFile}, got [${gotIds.join(', ')}]`);
    }

    if (mismatches.length > 0) {
      errors.push(`[${step}] Blob ${blobId}: ${mismatches.join('; ')}`);
      results.push({ step, ok: false, blob: blobJson });
    } else {
      results.push({ step, ok: true });
    }
  }

  return { errors, results };
}

async function main() {
  const args = process.argv.slice(2);
  let manifestPath = args[0];
  let rpcUrl = DEFAULT_RPC;
  let gatewayUrl = DEFAULT_ARWEAVE_GATEWAY;

  const rpcIdx = args.indexOf('--rpc');
  if (rpcIdx !== -1 && args[rpcIdx + 1]) {
    rpcUrl = args[rpcIdx + 1];
  }
  const gwIdx = args.indexOf('--arweave-gateway');
  if (gwIdx !== -1 && args[gwIdx + 1]) {
    gatewayUrl = args[gwIdx + 1];
  }

  if (!manifestPath) {
    console.error('Usage: node verify-chain.js <path-to-chain-manifest.json> [--rpc <url>] [--arweave-gateway <url>]');
    process.exit(1);
  }

  const resolvedManifestPath = path.isAbsolute(manifestPath) ? manifestPath : path.resolve(process.cwd(), manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(resolvedManifestPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read manifest:', e.message);
    process.exit(1);
  }

  console.log('Verifying Polygon anchors...');
  const polygon = await verifyPolygonAnchors(manifest, rpcUrl);
  console.log('Verifying Arweave blobs (genesis + supports)...');
  const arweave = await verifyArweaveBlobs(manifest, resolvedManifestPath, gatewayUrl);

  const allErrors = [...polygon.errors, ...arweave.errors];
  const polygonOk = polygon.results.filter((r) => r.ok).length;
  const arweaveOk = arweave.results.filter((r) => r.ok).length;

  console.log('\n--- Polygon anchors ---');
  polygon.results.forEach((r) => {
    console.log(r.ok ? `  ${r.step}: OK` : `  ${r.step}: FAIL`);
  });
  console.log('\n--- Arweave blobs (genesis + support refs) ---');
  arweave.results.forEach((r) => {
    console.log(r.ok ? `  ${r.step}: OK` : `  ${r.step}: FAIL`);
  });

  if (allErrors.length > 0) {
    console.log('\n--- Errors ---');
    allErrors.forEach((e) => console.log(' ', e));
    process.exit(1);
  }

  console.log(`\nAll ${polygonOk} Polygon anchors and ${arweaveOk} Arweave blobs verified.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
