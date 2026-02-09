/**
 * Build full ChainRoute chain by walking forward from genesis: delegate by delegate,
 * search txs by from-address, filter by genesis in payload, order by prev hash.
 */

import { ethers } from 'ethers';
import { decodePayload, isGenesisPayload, ZERO_64 } from './decode-payload.js';
import { enrichChainBlobs } from './enrich-blobs.js';

const DEFAULT_RPC = 'https://polygon-bor-rpc.publicnode.com';
const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';
const POLYGONSCAN_API = 'https://api.polygonscan.com/api';

/**
 * Fetch transactions sent by address from Polygonscan; filter to 127-byte payloads that start with genesis hash.
 * @param {string} address - 0x + 40 hex
 * @param {string} genesisHash - 64 hex
 * @param {{ polygonscanApiKey?: string }} opts
 */
async function getAnchorsFromAddress(address, genesisHash, opts = {}) {
  const url = `${POLYGONSCAN_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=500${opts.polygonscanApiKey ? '&apikey=' + opts.polygonscanApiKey : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Polygonscan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === '0' && data.message === 'No transactions found') {
    return [];
  }
  if (data.message && data.message !== 'OK' && data.result?.length === undefined) {
    const err = typeof data.result === 'string' ? data.result : data.message || 'Polygonscan error';
    throw new Error(err);
  }
  const list = Array.isArray(data.result) ? data.result : [];
  const genesisHex = genesisHash.toLowerCase();
  const out = [];
  for (const tx of list) {
    const input = tx.input || '';
    if (input.length !== 2 + 254 || !input.startsWith('0x')) continue;
    if (input.slice(2, 2 + 64).toLowerCase() !== genesisHex) continue;
    let decoded;
    try {
      decoded = decodePayload(input);
    } catch (_) {
      continue;
    }
    out.push({ txHash: tx.hash, decoded });
  }
  return out;
}

/**
 * Order anchors by prev hash starting from startTxHash: first has prev = startTxHash (or zeros),
 * then prev = first's hash, etc.
 * @param {Array<{ txHash: string, decoded: object }>} anchors
 * @param {string} startTxHash - 0x + 64 hex (genesis or last tx in chain so far)
 */
function orderAnchorsByPrev(anchors, startTxHash) {
  const startHex = startTxHash.replace(/^0x/i, '').toLowerCase();
  const byPrev = new Map();
  for (const a of anchors) {
    const prev = a.decoded.previousPolygonHash.toLowerCase();
    const key = prev === ZERO_64 ? startHex : prev;
    if (!byPrev.has(key)) byPrev.set(key, []);
    byPrev.get(key).push(a);
  }
  const ordered = [];
  let currentHex = startHex;
  while (true) {
    const next = byPrev.get(currentHex);
    if (!next || next.length === 0) break;
    ordered.push(next[0]);
    currentHex = next[0].txHash.replace(/^0x/i, '').toLowerCase();
  }
  return ordered;
}

/**
 * Walk forward from genesis hash: fetch genesis tx, get delegate, then for each delegate
 * get their anchors, order by prev, append to chain, next delegate = last anchor's delegate.
 * @param {string} genesisHash - 64 hex (with or without 0x)
 * @param {{ rpcUrl?: string, arweaveGateway?: string, polygonscanApiKey?: string }} opts
 * @returns {Promise<{ status: 'verified'|'invalid', genesisHash: string, chain: Array<object>, errors: string[] }>}
 */
export async function walkForward(genesisHash, opts = {}) {
  const rpcUrl = opts.rpcUrl || DEFAULT_RPC;
  const gateway = (opts.arweaveGateway || DEFAULT_ARWEAVE_GATEWAY).replace(/\/$/, '');
  const errors = [];
  const genesisHex = genesisHash.replace(/^0x/i, '').toLowerCase();
  if (genesisHex.length !== 64 || !/^[0-9a-f]+$/.test(genesisHex)) {
    return { status: 'invalid', genesisHash: '', chain: [], errors: ['Invalid genesis hash (64 hex)'] };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const genesisTxHash = '0x' + genesisHex;

  let tx;
  try {
    tx = await provider.getTransaction(genesisTxHash);
  } catch (e) {
    errors.push(`Failed to fetch genesis tx: ${e.message}`);
    return { status: 'invalid', genesisHash: genesisHex, chain: [], errors };
  }

  if (!tx || !tx.hash || !tx.data || tx.data.length !== 2 + 254) {
    errors.push('Genesis tx not found or invalid data');
    return { status: 'invalid', genesisHash: genesisHex, chain: [], errors };
  }

  let decoded;
  try {
    decoded = decodePayload(tx.data);
  } catch (e) {
    errors.push(`Genesis payload decode failed: ${e.message}`);
    return { status: 'invalid', genesisHash: genesisHex, chain: [], errors };
  }

  if (!isGenesisPayload(decoded)) {
    errors.push('Tx is not a ChainRoute genesis (expected zeros in payload)');
    return { status: 'invalid', genesisHash: genesisHex, chain: [], errors };
  }

  const chain = [
    {
      step: 'genesis',
      txHash: tx.hash,
      delegate: decoded.delegate,
      arweaveId: null,
      prevHash: null,
    },
  ];

  let currentDelegate = decoded.delegate.toLowerCase();
  const seenDelegates = new Set([currentDelegate]);

  while (true) {
    const delegateAddress = currentDelegate.startsWith('0x') ? currentDelegate : '0x' + currentDelegate;
    let anchors;
    try {
      anchors = await getAnchorsFromAddress(delegateAddress, genesisHex, opts);
    } catch (e) {
      errors.push(`Failed to get txs for delegate ${currentDelegate}: ${e.message}`);
      break;
    }

    const lastInChain = chain[chain.length - 1].txHash;
    const ordered = orderAnchorsByPrev(anchors, lastInChain);
    if (ordered.length === 0) break;

    for (const a of ordered) {
      const prev = a.decoded.previousPolygonHash.toLowerCase();
      chain.push({
        step: 'event',
        txHash: a.txHash,
        prevHash: prev === ZERO_64 ? null : '0x' + prev,
        arweaveId: a.decoded.arweaveId || null,
        delegate: a.decoded.delegate,
      });
    }

    const nextDelegate = ordered[ordered.length - 1].decoded.delegate.toLowerCase();
    if (nextDelegate === currentDelegate || seenDelegates.has(nextDelegate)) break;
    seenDelegates.add(nextDelegate);
    currentDelegate = nextDelegate;
  }

  const blobErrors = await enrichChainBlobs(chain, genesisHex, gateway);
  errors.push(...blobErrors);

  const status = errors.length === 0 ? 'verified' : 'invalid';
  return { status, genesisHash: genesisHex, chain, errors };
}
