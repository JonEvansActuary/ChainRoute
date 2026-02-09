/**
 * Verify a ChainRoute chain starting from a single Polygon tx hash.
 * Traverses backward to genesis, fetches Arweave blobs for each event, validates.
 */

import { ethers } from 'ethers';
import { decodePayload, isGenesisPayload, ZERO_64 } from './decode-payload.js';
import { enrichChainBlobs } from './enrich-blobs.js';

const DEFAULT_RPC = 'https://polygon-bor-rpc.publicnode.com';
const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';

/**
 * @param {string} txHash - 0x-prefixed Polygon tx hash
 * @param {{ rpcUrl?: string, arweaveGateway?: string }} opts
 * @returns {Promise<{ status: 'verified'|'invalid', genesisHash: string, chain: Array<object>, errors: string[] }>}
 */
export async function verifyFromTxHash(txHash, opts = {}) {
  const rpcUrl = opts.rpcUrl || DEFAULT_RPC;
  const gateway = (opts.arweaveGateway || DEFAULT_ARWEAVE_GATEWAY).replace(/\/$/, '');
  const errors = [];
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Normalize
  const wantHash = txHash.startsWith('0x') ? txHash : '0x' + txHash;
  if (wantHash.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(wantHash)) {
    return { status: 'invalid', genesisHash: '', chain: [], errors: ['Invalid tx hash (expected 0x + 64 hex)'] };
  }

  const chain = []; // will be built from latest back to genesis, then reversed
  let currentHash = wantHash;
  let genesisHash = '';

  // Traverse backward to genesis
  while (true) {
    let tx;
    try {
      tx = await provider.getTransaction(currentHash);
    } catch (e) {
      errors.push(`Failed to fetch tx ${currentHash}: ${e.message}`);
      return { status: 'invalid', genesisHash: '', chain: [], errors };
    }

    if (!tx || !tx.hash) {
      errors.push(`Tx not found: ${currentHash}`);
      return { status: 'invalid', genesisHash: '', chain: [], errors };
    }

    const data = tx.data && tx.data !== '0x' ? tx.data : null;
    if (!data || data.length !== 2 + 254) {
      errors.push(`Tx ${tx.hash} has invalid or missing data (expected 127 bytes hex)`);
      return { status: 'invalid', genesisHash: '', chain: [], errors };
    }

    let decoded;
    try {
      decoded = decodePayload(data);
    } catch (e) {
      errors.push(`Tx ${tx.hash} decode failed: ${e.message}`);
      return { status: 'invalid', genesisHash: '', chain: [], errors };
    }

    const txHashHex = tx.hash.replace(/^0x/i, '').toLowerCase();

    if (isGenesisPayload(decoded)) {
      // This tx is the genesis; its hash is the chain's genesis hash
      genesisHash = txHashHex;
      chain.push({
        step: 'genesis',
        txHash: tx.hash,
        delegate: decoded.delegate,
        arweaveId: null,
        prevHash: null,
      });
      break;
    }

    // Event: payload has genesis, prev, blob, delegate
    if (!genesisHash) genesisHash = decoded.genesisHash.toLowerCase();
    else if (decoded.genesisHash.toLowerCase() !== genesisHash) {
      errors.push(`Genesis hash mismatch at tx ${tx.hash}`);
      return { status: 'invalid', genesisHash: '', chain: [], errors };
    }

    const prevHash = decoded.previousPolygonHash.toLowerCase();
    chain.push({
      step: chain.length === 0 ? 'event' : 'event',
      txHash: tx.hash,
      prevHash: prevHash === ZERO_64 ? null : '0x' + prevHash,
      arweaveId: decoded.arweaveId || null,
      delegate: decoded.delegate,
    });

    if (prevHash === ZERO_64) {
      // Next is genesis tx
      currentHash = '0x' + genesisHash;
    } else {
      currentHash = '0x' + prevHash;
    }
  }

  // Order from genesis to latest (reverse)
  chain.reverse();

  const blobErrors = await enrichChainBlobs(chain, genesisHash, gateway);
  errors.push(...blobErrors);

  const status = errors.length === 0 ? 'verified' : 'invalid';
  return { status, genesisHash, chain, errors };
}
