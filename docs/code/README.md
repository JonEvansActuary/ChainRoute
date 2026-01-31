# ChainRoute Example Code (JavaScript)

Runnable JavaScript helpers for the [ChainRoute Protocol](../../protocol.md). Full flow: (1) post **supporting files** to Arweave and get their IDs, (2) build and post the **provenance event blob** (genesis + event metadata + list of those support IDs) to Arweave and get its ID, (3) post the **Polygon anchor** tx with that blob ID in the 127-byte payload.

**Node 18+** required for scripts that use npm deps. Run from `docs/code/` after `npm install`, or use paths from repo root (e.g. `node docs/code/build-polygon-payload.js docs/examples/Polygon/genesis-payload.json`). NPM scripts: `npm run post-support`, `npm run post-blob`, `npm run post-anchor`, `npm run post-event`.

## Scripts (no npm deps)

| File | Description |
|------|-------------|
| [build-polygon-payload.js](./build-polygon-payload.js) | Build 127-byte Polygon tx `data` from JSON (genesisHash, previousPolygonHash, arweaveId as 43-char string or null for genesis, delegate). |
| [validate-arweave-blob.js](./validate-arweave-blob.js) | Validate provenance blob (genesis, eventType, timestamp, summary, supports). |

## Scripts (require `npm install`)

| File | Description |
|------|-------------|
| [post-support-to-arweave.js](./post-support-to-arweave.js) | Post a **supporting file** (image, PDF, etc.) to Arweave. Optional `--genesis` tag. Returns Arweave tx ID. **Requires** `arweave`. |
| [post-provenance-blob-to-arweave.js](./post-provenance-blob-to-arweave.js) | Build the **provenance event blob** (genesis + eventType + timestamp + summary + list of support IDs), post to Arweave. Returns blob’s Arweave tx ID. Supports from `--supports` file or from event file’s `supports` key. **Requires** `arweave`. |
| [post-polygon-anchor.js](./post-polygon-anchor.js) | Build 127-byte payload (genesis, prev hash, **full 43-char blob’s Arweave ID**, delegate), sign and send Polygon data-only tx. Returns Polygon tx hash. **Requires** `ethers`. |
| [post-event.js](./post-event.js) | **Orchestrator**: upload support files → post provenance blob → post Polygon anchor. Returns `{ polygonTxHash, arweaveBlobTxId }`. **Requires** `arweave` and `ethers`. |

Shared module (no CLI): [arweave-post.js](./arweave-post.js) — `postDataToArweave(data, keyPath, tags, opts)` used by the Arweave-posting scripts.

## Full flow (step by step)

```bash
cd docs/code && npm install

# 1. Post supporting files to Arweave (optional --genesis)
node post-support-to-arweave.js photo.jpg --genesis <genesis-64-hex> --key path/to/arweave-key.json
# → Arweave tx ID 1
node post-support-to-arweave.js invoice.pdf --genesis <genesis-64-hex> --key path/to/arweave-key.json
# → Arweave tx ID 2

# 2. Write supports list and event metadata
echo '[{"id":"<tx-id-1>","label":"photo"},{"id":"<tx-id-2>","label":"invoice"}]' > supports.json
# event.json: { "eventType": "transfer", "summary": { "from": "...", "to": "...", "description": "..." } }

# 3. Post provenance blob (genesis + event + supports)
node post-provenance-blob-to-arweave.js <genesis-hash> event.json --supports supports.json --key path/to/arweave-key.json
# Or put "supports" inside event.json and omit --supports
# → Arweave blob tx ID (43 chars)

# 4. Post Polygon anchor with that blob ID (43-char string stored as 43 bytes in payload)
node post-polygon-anchor.js <genesis-hash> <prev-polygon-hash> <arweave-blob-tx-id> <delegate-address> --key path/to/polygon-key-hex.txt
# → Polygon tx hash (use as prev hash for next event)
```

## One-shot: full event

```bash
node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> event.json photo.jpg photo invoice.pdf invoice --arweave-key path/to/arweave-key.json --polygon-key path/to/polygon-key-hex.txt
# Or with a manifest: node post-event.js <genesis> <prev> <delegate> event.json --supports manifest.json
# manifest.json: [ { "path": "photo.jpg", "label": "photo" }, { "path": "invoice.pdf", "label": "invoice" } ]
```

Output: `{ "polygonTxHash": "...", "arweaveBlobTxId": "..." }`. Use the blob ID to find the provenance event on Arweave (`https://arweave.net/<arweaveBlobTxId>`); use the Polygon hash as the previous hash for the next event.

## Env / keys

- **Arweave**: JWK key file. Set `ARWEAVE_KEY_PATH` or pass `--key` (post-support, post-provenance-blob) or `--arweave-key` (post-event).
- **Polygon**: Private key (hex). Set `POLYGON_PRIVATE_KEY` or pass `--key` (post-polygon-anchor) or `--polygon-key` (post-event, path to file containing hex).

You can also `require()` the modules and call the exported functions from your own code.
