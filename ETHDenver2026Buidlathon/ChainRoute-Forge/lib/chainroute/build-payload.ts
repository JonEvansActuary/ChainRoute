/**
 * Build and decode the 127-byte ChainRoute Polygon payload.
 * Protocol: genesisHash (32) + previousPolygonHash (32) + arweaveId (43) + delegate (20).
 */

import { PAYLOAD_LEN } from "./types";

const HEX_32 = /^[0-9a-fA-F]{64}$/;
const DELEGATE = /^0x[0-9a-fA-F]{40}$/;
const ARWEAVE_ID_LEN = 43;

export interface PayloadInput {
  genesisHash: string;
  previousPolygonHash: string;
  arweaveId?: string | null;
  delegate: string;
}

/**
 * Build 127-byte payload buffer from a Polygon payload.
 */
export function buildPayload(payload: PayloadInput): Uint8Array {
  const { genesisHash, previousPolygonHash, arweaveId, delegate } = payload;

  if (!HEX_32.test(genesisHash)) throw new Error("genesisHash must be 64 hex chars");
  if (!HEX_32.test(previousPolygonHash)) throw new Error("previousPolygonHash must be 64 hex chars");
  if (!DELEGATE.test(delegate)) throw new Error("delegate must be 0x + 40 hex chars");

  let arweaveIdBuf: Uint8Array;
  if (arweaveId == null || arweaveId === "" || arweaveId === "0") {
    arweaveIdBuf = new Uint8Array(ARWEAVE_ID_LEN);
  } else {
    if (typeof arweaveId !== "string" || arweaveId.length !== ARWEAVE_ID_LEN) {
      throw new Error("arweaveId must be 43-character string (or null/empty for genesis)");
    }
    const enc = new TextEncoder().encode(arweaveId);
    if (enc.length !== ARWEAVE_ID_LEN) {
      throw new Error("arweaveId must encode to exactly 43 UTF-8 bytes");
    }
    arweaveIdBuf = enc;
  }

  const delegateHex = delegate.slice(2).toLowerCase();
  const out = new Uint8Array(PAYLOAD_LEN);
  let off = 0;
  out.set(hexToBytes(genesisHash), off); off += 32;
  out.set(hexToBytes(previousPolygonHash), off); off += 32;
  out.set(arweaveIdBuf, off); off += 43;
  out.set(hexToBytes(delegateHex), off);
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const buf = new Uint8Array(hex.length / 2);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return buf;
}

/**
 * Build 127-byte payload as hex string (for tx data).
 */
export function buildPayloadHex(payload: PayloadInput): string {
  return uint8ToHex(buildPayload(payload));
}

function uint8ToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface DecodedPayload {
  genesisHash: string;
  previousPolygonHash: string;
  arweaveId: string;
  delegate: string;
}

/**
 * Decode 127-byte ChainRoute payload (e.g. from Polygon tx data).
 */
export function decodePayload(data: Uint8Array | string): DecodedPayload {
  const buf =
    typeof data === "string"
      ? hexToBytes(data.replace(/^0x/i, ""))
      : data;
  if (buf.length !== PAYLOAD_LEN) {
    throw new Error(`Payload must be ${PAYLOAD_LEN} bytes, got ${buf.length}`);
  }
  const genesisHash = bytesToHex(buf.slice(0, 32));
  const previousPolygonHash = bytesToHex(buf.slice(32, 64));
  const arweaveIdBuf = buf.slice(64, 107);
  const arweaveId = arweaveIdBuf.every((b) => b === 0)
    ? ""
    : new TextDecoder().decode(arweaveIdBuf);
  const delegate = "0x" + bytesToHex(buf.slice(107, 127));
  return { genesisHash, previousPolygonHash, arweaveId, delegate };
}

function bytesToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export { PAYLOAD_LEN };
