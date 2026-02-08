# ChainRoute Example Code (JavaScript)

Runnable JavaScript helpers for the [ChainRoute Protocol](../../protocol.md). Full flow: (1) post **supporting files** to Arweave and get their IDs, (2) build and post the **provenance event blob** (genesis + event metadata + list of those support IDs) to Arweave and get its ID, (3) post the **Polygon anchor** tx with that blob ID in the 127-byte payload.

**Node 18+** required for scripts that use npm deps. Run from `docs/code/` after `npm install` (installs ethers, arweave, Ledger + EthereumJS deps for Polygon signing). Use paths from repo root (e.g. `node docs/code/build-polygon-payload.js docs/examples/Polygon/genesis-payload.json`). NPM scripts: `npm run post-support`, `npm run post-blob`, `npm run post-anchor`, `npm run post-event`.

## Scripts (no npm deps)

| File | Description |
|------|-------------|
| [build-polygon-payload.js](./build-polygon-payload.js) | Build 127-byte Polygon tx `data` from JSON (genesisHash, previousPolygonHash, arweaveId as 43-char string or null/empty/0 for genesis, delegate). Exports `decodePayload(data)` for the reverse. |
| [validate-arweave-blob.js](./validate-arweave-blob.js) | Validate provenance blob (genesis, eventType, timestamp, summary, supports). |
| [verify-chain.js](./verify-chain.js) | **Verify a full chain**: given a [chain-manifest.json](../examples/HypotheticalPainting/chain-manifest.json), checks each Polygon anchor (genesis/prev/blob ID/delegate) and each Arweave blob (genesis + support IDs). `node verify-chain.js path/to/chain-manifest.json [--rpc url] [--arweave-gateway url]` |
| [verify-support-tags.js](./verify-support-tags.js) | **Verify support-file genesis tags**: checks that every Arweave support tx in the manifest’s supports files has the `ChainRoute-Genesis` tag set to the chain genesis hash (via Arweave GraphQL). `node verify-support-tags.js path/to/chain-manifest.json [--gateway url]` |

## Scripts (require `npm install`)

| File | Description |
|------|-------------|
| [post-support-to-arweave.js](./post-support-to-arweave.js) | Post a **supporting file** (image, PDF, etc.) to Arweave. Optional `--genesis` tag. Returns Arweave tx ID. **Requires** `arweave`. |
| [post-provenance-blob-to-arweave.js](./post-provenance-blob-to-arweave.js) | Build the **provenance event blob** (genesis + eventType + timestamp + summary + list of support IDs), post to Arweave. Returns blob’s Arweave tx ID. Supports from `--supports` file or from event file’s `supports` key. **Requires** `arweave`. |
| [post-polygon-anchor.js](./post-polygon-anchor.js) | Build 127-byte payload (genesis, prev hash, **full 43-char blob’s Arweave ID**, delegate), sign and send Polygon data-only tx. Returns Polygon tx hash. **Requires** `ethers`. Supports **Ledger** (e.g. Stax): use `--key ledger` [and optional `--ledger-path`]. |
| [post-event.js](./post-event.js) | **Orchestrator**: upload support files → post provenance blob → post Polygon anchor. Returns `{ polygonTxHash, arweaveBlobTxId }`. **Requires** `arweave` and `ethers`. Use `--polygon-key ledger` for Ledger signing. |

Shared modules (no CLI): [arweave-post.js](./arweave-post.js) — `postDataToArweave(...)` for Arweave; [polygon-ledger-sign.js](./polygon-ledger-sign.js) — `signAndSendWithLedger(...)` for Ledger Stax/device (EIP-1559).

## Full flow (step by step)

```bash
cd docs/code && npm install

# 0. (Optional) Post genesis Polygon tx first; then use its tx hash as <genesis-hash> below.
#    node post-polygon-anchor.js 0000...0 0000...0 "" <delegate-address> --key path/to/polygon-key
#    Or: node build-polygon-payload.js path/to/genesis-payload.json and sign/send the hex with your wallet.

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
# Or with Ledger Stax/device: --key ledger [--ledger-path "44'/60'/0'/0/0"]
# → Polygon tx hash (use as prev hash for next event)
```

## One-shot: full event

```bash
node post-event.js <genesis-hash> <prev-polygon-hash> <delegate-address> event.json photo.jpg photo invoice.pdf invoice --arweave-key path/to/arweave-key.json --polygon-key path/to/polygon-key-hex.txt
# Or with Ledger for Polygon: --polygon-key ledger [--ledger-path "44'/60'/0'/0/0"]
# Or with a manifest: node post-event.js <genesis> <prev> <delegate> event.json --supports manifest.json
# manifest.json: [ { "path": "photo.jpg", "label": "photo" }, { "path": "invoice.pdf", "label": "invoice" } ]
```

Output: `{ "polygonTxHash": "...", "arweaveBlobTxId": "..." }`. Use the blob ID to find the provenance event on Arweave (`https://arweave.net/<arweaveBlobTxId>`); use the Polygon hash as the previous hash for the next event.

## Env / keys

- **Arweave**: JWK key file. Set `ARWEAVE_KEY_PATH` or pass `--key` (post-support, post-provenance-blob) or `--arweave-key` (post-event).
- **Polygon**: Private key (hex) or Ledger. Set `POLYGON_PRIVATE_KEY` or pass `--key` (post-polygon-anchor) or `--polygon-key` (post-event). Use `--key ledger` / `--polygon-key ledger` to sign with a **Ledger Stax** (or other Ledger device): connect via USB, open the Ethereum app, and enable **Blind signing** or **Contract data** in app settings for data-only txs. Optional `--ledger-path` / `POLYGON_LEDGER_PATH` (default `44'/60'/0'/0/0`). Path `44'/60'/0'/0/n` is resolved to Ledger Live account path `44'/60'/n'/0/0` so signer 0..6 match `keys/EVMaddresses.txt`. Run `node show-ledger-address.js --ledger-path "44'/60'/0'/0/0"` to confirm which address a path gives.

For examples with full payload JSONs and a signer file, see [HypotheticalPainting](../examples/HypotheticalPainting/). A mainnet test plan may be added under `docs/examples/` for live Polygon + Arweave testing.

You can also `require()` the modules and call the exported functions from your own code.
