#!/usr/bin/env node
/**
 * Full ChainRoute event flow: (1) post supporting files to Arweave and collect IDs,
 * (2) build and post the provenance blob (genesis + event metadata + support IDs) to Arweave,
 * (3) post the Polygon anchor tx with the blob's Arweave ID. Outputs Polygon tx hash and
 * Arweave blob ID.
 *
 * Requires: npm install arweave ethers
 * ARWEAVE_KEY_PATH, POLYGON_PRIVATE_KEY (or --arweave-key, --polygon-key)
 *
 * Usage:
 *   node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> <event-file.json> <support-file-1> [label1] [<support-file-2> [label2] ...] [--arweave-key path] [--polygon-key path]
 *
 * Or with a supports manifest (no inline labels):
 *   node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> <event-file.json> --supports manifest.json [--arweave-key path] [--polygon-key path]
 *
 * manifest.json: [ { "path": "photo.jpg", "label": "photo" }, { "path": "invoice.pdf", "label": "invoice" } ]
 */

const fs = require('fs');
const path = require('path');
const { postSupportToArweave } = require('./post-support-to-arweave.js');
const { buildProvenanceBlob, postProvenanceBlobToArweave } = require('./post-provenance-blob-to-arweave.js');
const { postPolygonAnchor } = require('./post-polygon-anchor.js');

async function main() {
  const args = process.argv.slice(2);
  let arweaveKeyPath = process.env.ARWEAVE_KEY_PATH;
  let polygonKeyPath = process.env.POLYGON_PRIVATE_KEY;
  let supportsManifestPath;

  const arweaveKeyIdx = args.indexOf('--arweave-key');
  if (arweaveKeyIdx !== -1 && args[arweaveKeyIdx + 1]) {
    arweaveKeyPath = args[arweaveKeyIdx + 1];
    args.splice(arweaveKeyIdx, 2);
  }
  const polygonKeyIdx = args.indexOf('--polygon-key');
  if (polygonKeyIdx !== -1 && args[polygonKeyIdx + 1]) {
    const v = args[polygonKeyIdx + 1];
    try {
      polygonKeyPath = fs.readFileSync(path.resolve(v), 'utf8').trim();
    } catch (e) {
      console.error('Failed to read polygon key file:', e.message);
      process.exit(1);
    }
    args.splice(polygonKeyIdx, 2);
  }
  const supportsIdx = args.indexOf('--supports');
  if (supportsIdx !== -1 && args[supportsIdx + 1]) {
    supportsManifestPath = args[supportsIdx + 1];
    args.splice(supportsIdx, 2);
  }

  const [genesisHash, prevHash, delegate, eventPath, ...rest] = args;

  if (!genesisHash || !prevHash || !delegate || !eventPath) {
    console.error('Usage: node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> <event-file.json> [support-file-1 [label1] support-file-2 [label2] ...]');
    console.error('   Or: node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> <event-file.json> --supports manifest.json');
    console.error('   Options: --arweave-key path, --polygon-key path');
    process.exit(1);
  }
  if (!arweaveKeyPath || !polygonKeyPath) {
    console.error('Error: Set ARWEAVE_KEY_PATH and POLYGON_PRIVATE_KEY, or use --arweave-key and --polygon-key');
    process.exit(1);
  }

  let event;
  try {
    const fullPath = path.isAbsolute(eventPath) ? eventPath : path.resolve(process.cwd(), eventPath);
    event = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read event file:', e.message);
    process.exit(1);
  }

  let supports = [];
  if (supportsManifestPath) {
    try {
      const fullPath = path.isAbsolute(supportsManifestPath) ? supportsManifestPath : path.resolve(process.cwd(), supportsManifestPath);
      const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (!Array.isArray(manifest)) throw new Error('manifest must be array of { path, label? }');
      const manifestDir = path.dirname(path.resolve(process.cwd(), supportsManifestPath));
      for (const item of manifest) {
        const filePath = path.isAbsolute(item.path) ? item.path : path.join(manifestDir, item.path);
        const txId = await postSupportToArweave(filePath, arweaveKeyPath, { genesis: genesisHash });
        supports.push({ id: txId, label: item.label });
      }
    } catch (e) {
      console.error('Supports manifest failed:', e.message);
      process.exit(1);
    }
  } else {
    let i = 0;
    while (i < rest.length) {
      const filePath = rest[i];
      const next = rest[i + 1];
      const label = next && !next.startsWith('-') && !path.extname(next) ? next : undefined;
      const txId = await postSupportToArweave(filePath, arweaveKeyPath, { genesis: genesisHash });
      supports.push({ id: txId, label: label || path.basename(filePath) });
      i += label != null ? 2 : 1;
    }
  }

  const blob = buildProvenanceBlob(genesisHash, event, supports);
  const arweaveBlobTxId = await postProvenanceBlobToArweave(blob, arweaveKeyPath);

  const polygonTxHash = await postPolygonAnchor(
    { genesisHash, previousPolygonHash: prevHash, arweaveBlobTxId, delegate },
    polygonKeyPath,
    {}
  );

  console.log(JSON.stringify({ polygonTxHash, arweaveBlobTxId }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { main };
