/**
 * ChainRoute protocol types (v0.1)
 */

export const PAYLOAD_LEN = 32 + 32 + 43 + 20; // 127

export interface PolygonPayload {
  genesisHash: string;
  previousPolygonHash: string;
  arweaveId: string | null;
  delegate: string;
}

export interface ProvenanceBlob {
  genesis: string;
  eventType: string;
  timestamp: string;
  summary: Record<string, unknown>;
  supports?: Array<{ id: string; label?: string }>;
}

export interface SupportItem {
  id: string;
  label?: string;
}

export interface ValidateBlobResult {
  valid: boolean;
  errors: string[];
}

export interface ChainAnchor {
  step: string;
  txHash: string;
  prevHash: string;
  delegate: string;
  arweaveBlobId?: string;
}

export interface ArweaveBlobEntry {
  step: string;
  blobId: string;
  supportsFile: string;
}

export interface ChainManifest {
  genesisHash: string;
  polygonAnchors: ChainAnchor[];
  arweaveBlobs: ArweaveBlobEntry[];
}
