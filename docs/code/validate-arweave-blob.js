#!/usr/bin/env node
/**
 * Validate a ChainRoute Arweave main provenance blob (JSON).
 * Checks: genesis (64 hex), eventType, timestamp (ISO 8601), summary (object), optional supports (id 43 chars).
 *
 * Usage:
 *   node validate-arweave-blob.js <path-to-blob.json>
 *   node -e "const { validateBlob } = require('./validate-arweave-blob.js'); console.log(validateBlob(require('./blob.json')));"
 */

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;
const SUPPORT_ID_PATTERN = /^[a-zA-Z0-9_-]{43}$/;
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Validate an Arweave provenance blob. Returns { valid: boolean, errors: string[] }.
 * @param {object} blob - Parsed JSON blob
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBlob(blob) {
  const errors = [];

  if (!blob || typeof blob !== 'object') {
    return { valid: false, errors: ['Blob must be an object'] };
  }

  if (!blob.genesis || typeof blob.genesis !== 'string') {
    errors.push('Missing or invalid "genesis" (required, string)');
  } else if (!GENESIS_PATTERN.test(blob.genesis)) {
    errors.push('"genesis" must be 64 hex characters');
  }

  if (!blob.eventType || typeof blob.eventType !== 'string') {
    errors.push('Missing or invalid "eventType" (required, string)');
  }

  if (!blob.timestamp || typeof blob.timestamp !== 'string') {
    errors.push('Missing or invalid "timestamp" (required, string)');
  } else if (!ISO_8601.test(blob.timestamp)) {
    errors.push('"timestamp" should be ISO 8601 (e.g. 2026-01-27T18:37:00Z)');
  }

  if (!blob.summary || typeof blob.summary !== 'object' || Array.isArray(blob.summary)) {
    errors.push('Missing or invalid "summary" (required, object)');
  }

  if (blob.supports !== undefined) {
    if (!Array.isArray(blob.supports)) {
      errors.push('"supports" must be an array');
    } else {
      blob.supports.forEach((item, i) => {
        if (!item || typeof item !== 'object') {
          errors.push(`supports[${i}]: must be an object with "id"`);
        } else if (!item.id || typeof item.id !== 'string') {
          errors.push(`supports[${i}]: missing "id"`);
        } else if (!SUPPORT_ID_PATTERN.test(item.id)) {
          errors.push(`supports[${i}]: "id" must be 43 chars [a-zA-Z0-9_-]`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CLI
if (require.main === module) {
  const fs = require('fs');
  const pathModule = require('path');
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validate-arweave-blob.js <path-to-blob.json>');
    process.exit(1);
  }
  let blob;
  try {
    const fullPath = pathModule.isAbsolute(filePath) ? filePath : pathModule.resolve(process.cwd(), filePath);
    blob = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read JSON:', e.message);
    process.exit(1);
  }
  const result = validateBlob(blob);
  if (result.valid) {
    console.log('Valid');
  } else {
    result.errors.forEach((e) => console.error(e));
    process.exit(1);
  }
}

module.exports = { validateBlob };
