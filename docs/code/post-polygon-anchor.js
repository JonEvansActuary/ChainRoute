#!/usr/bin/env node
/**
 * Build the 127-byte ChainRoute payload (genesis hash, previous Polygon hash,
 * full 43-char Arweave provenance blob ID, delegate), sign with the current delegate's key,
 * and send a data-only Polygon transaction. Returns the Polygon transaction hash
 * (used as prev hash for the next event).
 *
 * Requires: npm install ethers
 * Wallet: POLYGON_PRIVATE_KEY (hex) or --key <path-to-hex-file>
 *
 * Usage:
 *   node post-polygon-anchor.js <genesis-hash> <prev-polygon-hash> <arweave-blob-tx-id> <delegate-address> [--key path] [--rpc url]
 *
 * Arweave blob tx ID is the 43-char ID returned by post-provenance-blob-to-arweave.js (stored as 43 bytes in the payload).
 */

const fs = require('fs');
const path = require('path');
const { buildPayload } = require('./build-polygon-payload.js');

const HEX_64 = /^[0-9a-fA-F]{64}$/;
const DELEGATE = /^0x[0-9a-fA-F]{40}$/i;

/**
 * Post the ChainRoute anchor tx to Polygon and return the transaction hash.
 * @param {object} params - { genesisHash, previousPolygonHash, arweaveBlobTxId (43 char), delegate }
 * @param {string} privateKeyHex - Signer private key (hex, with or without 0x)
 * @param {object} [opts] - { rpcUrl, chainId }
 * @returns {Promise<string>} Polygon transaction hash
 */
async function postPolygonAnchor(params, privateKeyHex, opts = {}) {
  const ethers = require('ethers');
  const key = privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex;
  const provider = new ethers.JsonRpcProvider(opts.rpcUrl || 'https://polygon-rpc.com');
  const wallet = new ethers.Wallet(key, provider);
  const chainId = opts.chainId ?? 137;

  const payload = {
    genesisHash: params.genesisHash.toLowerCase(),
    previousPolygonHash: params.previousPolygonHash.toLowerCase(),
    arweaveId: params.arweaveBlobTxId,
    delegate: params.delegate,
  };
  const dataHex = buildPayload(payload).toString('hex');
  const tx = {
    to: wallet.address,
    data: '0x' + dataHex,
    value: 0n,
    gasLimit: 100000,
  };
  const sent = await wallet.sendTransaction(tx);
  const receipt = await sent.wait();
  return receipt.hash;
}

async function main() {
  const args = process.argv.slice(2);
  let keyPath = process.env.POLYGON_PRIVATE_KEY;
  let rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
  const keyIdx = args.indexOf('--key');
  if (keyIdx !== -1 && args[keyIdx + 1]) {
    const v = args[keyIdx + 1];
    if (v.startsWith('env:')) {
      keyPath = process.env[v.slice(4)];
    } else {
      try {
        keyPath = fs.readFileSync(path.resolve(v), 'utf8').trim();
      } catch (e) {
        console.error('Failed to read key file:', e.message);
        process.exit(1);
      }
    }
    args.splice(keyIdx, 2);
  }
  const rpcIdx = args.indexOf('--rpc');
  if (rpcIdx !== -1 && args[rpcIdx + 1]) {
    rpcUrl = args[rpcIdx + 1];
    args.splice(rpcIdx, 2);
  }
  const [genesisHash, prevHash, arweaveBlobTxId, delegate] = args;

  if (!genesisHash || !prevHash || !arweaveBlobTxId || !delegate) {
    console.error('Usage: node post-polygon-anchor.js <genesis-hash> <prev-polygon-hash> <arweave-blob-tx-id> <delegate-address> [--key path] [--rpc url]');
    process.exit(1);
  }
  if (!HEX_64.test(genesisHash) || !HEX_64.test(prevHash)) {
    console.error('Error: genesis and prev hash must be 64 hex chars');
    process.exit(1);
  }
  if (!DELEGATE.test(delegate)) {
    console.error('Error: delegate must be 0x + 40 hex (Ethereum address)');
    process.exit(1);
  }
  if (!keyPath) {
    console.error('Error: Set POLYGON_PRIVATE_KEY or pass --key <path-to-hex-file>');
    process.exit(1);
  }

  const privateKey = keyPath.trim();

  try {
    const txHash = await postPolygonAnchor(
      { genesisHash, previousPolygonHash: prevHash, arweaveBlobTxId, delegate },
      privateKey,
      { rpcUrl }
    );
    console.log(txHash);
  } catch (e) {
    console.error('Polygon tx failed:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { postPolygonAnchor };
