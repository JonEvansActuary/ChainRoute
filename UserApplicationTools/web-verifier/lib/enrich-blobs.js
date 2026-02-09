/**
 * Fetch Arweave blobs for each event in the chain and set blobOk / blobSummary.
 * Shared by backward and forward walk.
 */

import { decodePayload } from './decode-payload.js';

/**
 * @param {Array<{ step: string, txHash: string, arweaveId?: string | null }>} chain
 * @param {string} genesisHash - 64 hex lowercase
 * @param {string} gateway - Arweave gateway base URL
 * @returns {Promise<string[]>} errors pushed
 */
export async function enrichChainBlobs(chain, genesisHash, gateway) {
  const errors = [];
  const base = gateway.replace(/\/$/, '');

  for (let i = 0; i < chain.length; i++) {
    const anchor = chain[i];
    if (anchor.step === 'genesis' || !anchor.arweaveId) {
      anchor.blobOk = null;
      anchor.blobSummary = null;
      continue;
    }

    try {
      const res = await fetch(`${base}/${anchor.arweaveId}`);
      if (!res.ok) {
        errors.push(`[${anchor.txHash}] Arweave blob ${anchor.arweaveId}: HTTP ${res.status}`);
        anchor.blobOk = false;
        anchor.blobSummary = null;
        continue;
      }
      const blob = await res.json();
      const blobGenesis = (blob.genesis || '').toLowerCase();
      if (blobGenesis !== genesisHash) {
        errors.push(`[${anchor.txHash}] Blob genesis mismatch`);
        anchor.blobOk = false;
      } else {
        anchor.blobOk = true;
      }
      anchor.blobSummary = {
        eventType: blob.eventType,
        timestamp: blob.timestamp,
        summary: blob.summary,
        supports: blob.supports || [],
      };
    } catch (e) {
      errors.push(`[${anchor.txHash}] Failed to fetch blob: ${e.message}`);
      anchor.blobOk = false;
      anchor.blobSummary = null;
    }
  }

  return errors;
}
