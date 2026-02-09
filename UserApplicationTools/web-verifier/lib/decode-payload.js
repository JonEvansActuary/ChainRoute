/**
 * Decode 127-byte ChainRoute Polygon tx payload.
 * ChainRoute Protocol: genesisHash (32) + previousPolygonHash (32) + arweaveId (43) + delegate (20).
 */

const PAYLOAD_LEN = 32 + 32 + 43 + 20;
const ZERO_64 = '0'.repeat(64);

function decodePayload(data) {
  const hex = typeof data === 'string' ? data.replace(/^0x/i, '') : data.toString('hex');
  const buf = Buffer.from(hex, 'hex');
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

function isGenesisPayload(decoded) {
  return decoded.genesisHash === ZERO_64 && decoded.previousPolygonHash === ZERO_64 && !decoded.arweaveId;
}

export { decodePayload, isGenesisPayload, PAYLOAD_LEN, ZERO_64 };
