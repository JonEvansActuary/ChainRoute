#!/usr/bin/env node
/**
 * Build the 127-byte Polygon transaction data payload from a JSON object.
 * ChainRoute Protocol: genesisHash (32) + previousPolygonHash (32) + arweaveId (43) + delegate (20).
 * The Arweave ID field is always 43 bytes; for genesis (no blob) it is zero-padded to 43 bytes so the payload is always exactly 127 bytes.
 *
 * Usage:
 *   node build-polygon-payload.js <path-to-payload.json>
 */

const HEX_32 = /^[0-9a-fA-F]{64}$/;
const DELEGATE = /^0x[0-9a-fA-F]{40}$/;
const ARWEAVE_ID_LEN = 43;

/**
 * Build 127-byte payload buffer from a Polygon payload JSON.
 * @param {object} payload - { genesisHash, previousPolygonHash, arweaveId (43-char string, or null/empty/0 for genesis), delegate }
 * @returns {Buffer} 127 bytes
 */
function buildPayload(payload) {
  const { genesisHash, previousPolygonHash, arweaveId, delegate } = payload;

  if (!HEX_32.test(genesisHash)) throw new Error('genesisHash must be 64 hex chars');
  if (!HEX_32.test(previousPolygonHash)) throw new Error('previousPolygonHash must be 64 hex chars');
  if (!DELEGATE.test(delegate)) throw new Error('delegate must be 0x + 40 hex chars');

  // Arweave ID is always 43 bytes in the payload (zero-padded when no blob, e.g. genesis)
  let arweaveIdBuf;
  if (arweaveId == null || arweaveId === '' || arweaveId === 0) {
    arweaveIdBuf = Buffer.alloc(ARWEAVE_ID_LEN, 0);
  } else {
    if (typeof arweaveId !== 'string' || arweaveId.length !== ARWEAVE_ID_LEN) {
      throw new Error('arweaveId must be 43-character string (or null/empty/0 for genesis)');
    }
    arweaveIdBuf = Buffer.from(arweaveId, 'utf8');
    if (arweaveIdBuf.length !== ARWEAVE_ID_LEN) {
      throw new Error('arweaveId must encode to exactly 43 UTF-8 bytes');
    }
  }

  const delegateHex = delegate.slice(2).toLowerCase();
  return Buffer.concat([
    Buffer.from(genesisHash, 'hex'),
    Buffer.from(previousPolygonHash, 'hex'),
    arweaveIdBuf,
    Buffer.from(delegateHex, 'hex'),
  ]);
}

/**
 * Build 127-byte payload as hex string (for tx data field).
 * @param {object} payload - Polygon payload JSON
 * @returns {string} 254-char hex
 */
function buildPayloadHex(payload) {
  return buildPayload(payload).toString('hex');
}

const PAYLOAD_LEN = 32 + 32 + 43 + 20;

/**
 * Decode 127-byte ChainRoute payload (e.g. from Polygon tx data) into components.
 * @param {Buffer|string} data - 127 bytes or hex string (with or without 0x)
 * @returns {{ genesisHash: string, previousPolygonHash: string, arweaveId: string, delegate: string }}
 */
function decodePayload(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data.replace(/^0x/i, ''), 'hex');
  if (buf.length !== PAYLOAD_LEN) {
    throw new Error(`Payload must be ${PAYLOAD_LEN} bytes, got ${buf.length}`);
  }
  const genesisHash = buf.slice(0, 32).toString('hex');
  const previousPolygonHash = buf.slice(32, 64).toString('hex');
  const arweaveIdBuf = buf.slice(64, 107);
  const arweaveId = arweaveIdBuf.every((b) => b === 0) ? '' : arweaveIdBuf.toString('utf8');
  const delegate = '0x' + buf.slice(107, 127).toString('hex');
  return { genesisHash, previousPolygonHash, arweaveId, delegate };
}

// CLI
if (require.main === module) {
  const fs = require('fs');
  const pathModule = require('path');
  const payloadPath = process.argv[2];
  if (!payloadPath) {
    console.error('Usage: node build-polygon-payload.js <path-to-payload.json>');
    process.exit(1);
  }
  let payload;
  try {
    const fullPath = pathModule.isAbsolute(payloadPath) ? payloadPath : pathModule.resolve(process.cwd(), payloadPath);
    payload = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read JSON:', e.message);
    process.exit(1);
  }
  try {
    console.log(buildPayloadHex(payload));
  } catch (e) {
    console.error('Invalid payload:', e.message);
    process.exit(1);
  }
}

module.exports = { buildPayload, buildPayloadHex, decodePayload, PAYLOAD_LEN };
