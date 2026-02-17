/**
 * Build ChainRoute provenance blob (genesis + event + supports).
 */

import { validateBlob } from "./validate-blob";
import type { ProvenanceBlob, SupportItem } from "./types";

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;

export interface EventInput {
  eventType: string;
  timestamp?: string;
  summary: Record<string, unknown>;
  supports?: SupportItem[];
}

/**
 * Build the provenance blob object (ready for JSON stringify and Arweave).
 */
export function buildProvenanceBlob(
  genesisHash: string,
  event: EventInput,
  supports: SupportItem[] = []
): ProvenanceBlob {
  if (!GENESIS_PATTERN.test(genesisHash)) {
    throw new Error("genesis hash must be 64 hex characters");
  }
  const blob: ProvenanceBlob = {
    genesis: genesisHash.toLowerCase(),
    eventType: event.eventType,
    timestamp:
      event.timestamp ||
      new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    summary: event.summary,
  };
  const supportList = supports.length > 0 ? supports : event.supports ?? [];
  if (supportList.length > 0) {
    blob.supports = supportList.map((s) =>
      s.label != null ? { id: s.id, label: s.label } : { id: s.id }
    );
  }
  return blob;
}

/**
 * Validate blob and throw if invalid.
 */
export function buildAndValidateBlob(
  genesisHash: string,
  event: EventInput,
  supports: SupportItem[] = []
): ProvenanceBlob {
  const blob = buildProvenanceBlob(genesisHash, event, supports);
  const result = validateBlob(blob);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
  return blob;
}
