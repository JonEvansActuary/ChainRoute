/**
 * Validate a ChainRoute Arweave main provenance blob (JSON).
 */

import type { ValidateBlobResult } from "./types";

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;
const SUPPORT_ID_PATTERN = /^[a-zA-Z0-9_-]{43}$/;
const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

export function validateBlob(blob: unknown): ValidateBlobResult {
  const errors: string[] = [];

  if (!blob || typeof blob !== "object") {
    return { valid: false, errors: ["Blob must be an object"] };
  }

  const b = blob as Record<string, unknown>;

  if (!b.genesis || typeof b.genesis !== "string") {
    errors.push('Missing or invalid "genesis" (required, string)');
  } else if (!GENESIS_PATTERN.test(b.genesis)) {
    errors.push('"genesis" must be 64 hex characters');
  }

  if (!b.eventType || typeof b.eventType !== "string") {
    errors.push('Missing or invalid "eventType" (required, string)');
  }

  if (!b.timestamp || typeof b.timestamp !== "string") {
    errors.push('Missing or invalid "timestamp" (required, string)');
  } else if (!ISO_8601.test(b.timestamp)) {
    errors.push('"timestamp" should be ISO 8601 (e.g. 2026-01-27T18:37:00Z)');
  }

  if (
    !b.summary ||
    typeof b.summary !== "object" ||
    Array.isArray(b.summary)
  ) {
    errors.push('Missing or invalid "summary" (required, object)');
  }

  if (b.supports !== undefined) {
    if (!Array.isArray(b.supports)) {
      errors.push('"supports" must be an array');
    } else {
      (b.supports as unknown[]).forEach((item, i) => {
        if (!item || typeof item !== "object") {
          errors.push(`supports[${i}]: must be an object with "id"`);
        } else {
          const s = item as Record<string, unknown>;
          if (!s.id || typeof s.id !== "string") {
            errors.push(`supports[${i}]: missing "id"`);
          } else if (!SUPPORT_ID_PATTERN.test(s.id)) {
            errors.push(`supports[${i}]: "id" must be 43 chars [a-zA-Z0-9_-]`);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
