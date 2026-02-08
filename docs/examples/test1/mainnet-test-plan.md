# ChainRoute Mainnet Test Plan

Plan for **live testing** on **Polygon mainnet** and **Arweave mainnet** using **hypothetical provenance data** and **hypothetical supporting files**. All content is test/demo only—no real items or legal claims.

---

## 1. Objectives

- Confirm end-to-end flow on real networks: genesis → supporting files → provenance blob → Polygon anchor(s).
- Verify 127-byte payload construction, Arweave blob format, and optional chained event (e.g. transfer).
- Document commands, artifacts, and verification steps for future runs.

---

## 2. Prerequisites

### 2.1 Wallets and keys

| Network   | What you need | Notes |
|-----------|----------------|--------|
| **Arweave** | JWK key file (e.g. `keys/arweave-keyfile-*.json`) | One-time upload cost per tx; wallet needs AR. |
| **Polygon** | Private key (hex) **or** Ledger (e.g. Stax) | Small MATIC for gas; data-only txs are cheap. |

- **Arweave**: Get AR from an exchange or faucet; uploads cost ~AR per KiB (see [arweave.org](https://arweave.org)).
- **Polygon**: Get MATIC on Polygon mainnet; a few data-only txs usually cost fractions of a cent.

### 2.2 Environment

- **Node 18+**, from repo root or `docs/code/`.
- Run `npm install` in `docs/code/`.
- Optional: set `ARWEAVE_KEY_PATH` and/or `POLYGON_PRIVATE_KEY` in `.env` (if you load it), or pass `--key` / `--arweave-key` / `--polygon-key` on each command.

### 2.3 Signing choices

- **Polygon**: Use hex key file (`--key path/to/polygon-hex.txt`) or Ledger (`--key ledger`; enable Blind signing / Contract data in Ethereum app).
- **Arweave**: Use JWK path (`--key path/to/arweave-key.json` or `ARWEAVE_KEY_PATH`).

---

## 3. Hypothetical test data

All data is **fictional** and for protocol testing only.

### 3.1 Supporting files (hypothetical)

Create or use **small placeholder files** so costs stay low:

| File | Purpose | Suggestion |
|------|---------|------------|
| `test-photo.jpg` | “Item image” | Minimal valid JPEG (e.g. 1×1 pixel or tiny placeholder). |
| `test-invoice.pdf` | “Supporting document” | Minimal PDF (e.g. one page with “ChainRoute mainnet test – hypothetical”) or a tiny PDF. |

Store under a test folder, e.g. `docs/test-data/` (add to `.gitignore` if they contain paths or keys). Alternatively use any small image/PDF you already have; keep sizes small to minimize Arweave cost.

### 3.2 Event JSON (hypothetical)

- **Creation event** (first event after genesis): e.g. `docs/test-data/creation-event.json` with `eventType`, `summary` (item name, description, “hypothetical test”), and optional `supports` (filled after step 4.2).
- **Transfer event** (optional second event): e.g. `docs/test-data/transfer-event.json` with `eventType: "transfer"`, `summary: { from, to, description }` for a fake transfer.

Use the schema from [protocol.md](../../../protocol.md) and [Arweave](../Arweave/); ensure `genesis` is set to the **real genesis Polygon tx hash** from step 4.1 (not a placeholder).

---

## 4. Test phases (step-by-step)

### Phase 1: Genesis transaction (Polygon mainnet)

1. Build the genesis payload: genesis = 32 zero bytes, prev = 32 zero bytes, arweaveId = 43 zero bytes (no blob yet), delegate = your signer address (20 bytes).
2. Sign and send **one** data-only Polygon tx (to self or null, 127-byte `data`).
3. **Record the Polygon transaction hash** — this is your **GENESIS_HASH** for all later steps and blobs.

**Command:**

```bash
cd docs/code
# Third arg is empty string "" for genesis (encodes to 43 zero bytes). Replace 0xYOUR_DELEGATE_ADDRESS with your Polygon address.
node post-polygon-anchor.js 0000000000000000000000000000000000000000000000000000000000000000 0000000000000000000000000000000000000000000000000000000000000000 "" 0xYOUR_DELEGATE_ADDRESS --key path/to/polygon-key.txt
# Or with Ledger: --key ledger
```

Record the printed Polygon tx hash as **GENESIS_HASH** (64 hex chars, no `0x`).

### Phase 2: Supporting files to Arweave mainnet

1. Upload hypothetical supporting files (e.g. `test-photo.jpg`, `test-invoice.pdf`) with the genesis tag set to **GENESIS_HASH**.
2. **Record each Arweave transaction ID** (43-char).

**Commands:**

```bash
node post-support-to-arweave.js path/to/test-photo.jpg --genesis GENESIS_HASH --key path/to/arweave-key.json
# → Arweave tx ID 1 (e.g. abc...)
node post-support-to-arweave.js path/to/test-invoice.pdf --genesis GENESIS_HASH --key path/to/arweave-key.json
# → Arweave tx ID 2
```

### Phase 3: Provenance blob to Arweave mainnet

1. Create `creation-event.json` with hypothetical summary; set `genesis` to **GENESIS_HASH** (64 hex).
2. Set `supports` to the list of Arweave IDs from Phase 2 (with labels, e.g. `photo`, `invoice`).
3. Post the blob; **record the returned Arweave blob tx ID** (43-char).

**Command:**

```bash
echo '[{"id":"ARWEAVE_TX_ID_1","label":"photo"},{"id":"ARWEAVE_TX_ID_2","label":"invoice"}]' > supports.json
node post-provenance-blob-to-arweave.js GENESIS_HASH creation-event.json --supports supports.json --key path/to/arweave-key.json
# → Arweave blob tx ID (43 chars)
```

### Phase 4: First event anchor (Polygon mainnet)

1. Sign and send a Polygon data-only tx with: genesis = **GENESIS_HASH**, previous = **GENESIS_HASH** (or 32 zeros for “first event after genesis”—see protocol), arweaveId = **blob tx ID from Phase 3**, delegate = your or next address.
2. **Record the Polygon transaction hash** (this is the “previous” hash for the next event).

**Command:**

```bash
# First event after genesis: prev = 32 zero bytes (or genesis hash—see protocol)
node post-polygon-anchor.js GENESIS_HASH 0000000000000000000000000000000000000000000000000000000000000000 ARWEAVE_BLOB_TX_ID_43_CHARS 0xYOUR_DELEGATE_ADDRESS --key path/to/polygon-key.txt
# Or: --key ledger
# → Polygon tx hash (e.g. 0x...)
```

### Phase 5 (optional): Second event (transfer) – chained

1. Create hypothetical `transfer-event.json` (genesis = GENESIS_HASH, eventType = transfer, summary = from/to/description).
2. Post **one** more supporting file to Arweave if desired, or reuse existing supports.
3. Post a **second** provenance blob to Arweave; record its tx ID.
4. Post a **second** Polygon anchor with genesis = GENESIS_HASH, previous = **Polygon hash from Phase 4**, arweaveId = new blob ID, delegate = address.

This confirms chaining (previous hash → next tx).

---

## 5. Verification checklist

After each phase:

| Check | Where | What to verify |
|-------|--------|----------------|
| Genesis Polygon tx | Polygonscan (Polygon mainnet) | Tx exists; `data` length 0x7f (127 bytes); from your address. |
| Supporting file 1 | arweave.net | Paste Arweave tx ID; content and tags (e.g. ChainRoute-Genesis) if visible. |
| Supporting file 2 | arweave.net | Same. |
| Provenance blob | arweave.net | JSON with genesis, eventType, timestamp, summary, supports. |
| First event anchor | Polygonscan | Tx with same genesis; data contains Arweave blob ID in payload. |
| Second event (if run) | Polygonscan + Arweave | New blob and new Polygon tx; prev hash links to Phase 4 tx. |

Optional: use `validate-arweave-blob.js` on the downloaded blob JSON to confirm schema.

---

## 6. Costs and safety

- **Polygon**: Data-only txs are low cost; expect very small MATIC per tx. Use a dedicated test wallet with limited MATIC.
- **Arweave**: Pay per KiB; use **small** hypothetical files and small JSON to minimize cost. AR is one-way (no refunds).
- **Data**: All content is hypothetical; no real items, identities, or legal claims. Label clearly in summaries (e.g. “ChainRoute mainnet test – hypothetical”).

---

## 7. Artifacts to keep

- **GENESIS_HASH** (64 hex).
- **Polygon tx hashes** (each 0x66-char).
- **Arweave tx IDs** (supporting files + blobs, each 43-char).
- Optional: copy of `creation-event.json`, `transfer-event.json`, and `supports.json` used (with real IDs) into `docs/test-data/` or a private folder; do not commit keys or sensitive paths.

---

## 8. One-shot alternative

To run the full first event (supporting files + blob + anchor) in one go:

```bash
node post-event.js GENESIS_HASH 0000000000000000000000000000000000000000000000000000000000000000 0xDELEGATE creation-event.json test-photo.jpg photo test-invoice.pdf invoice --arweave-key path/to/arweave-key.json --polygon-key path/to/polygon-key.txt
# Or: --polygon-key ledger
```

Ensure **GENESIS_HASH** is from a **real** genesis Polygon tx you already posted (Phase 1). The “prev” hash for the first event is 64 zero hex. Output: `{ "polygonTxHash": "...", "arweaveBlobTxId": "..." }`.

---

## 9. Summary

1. **Prerequisites**: Arweave JWK + AR; Polygon key or Ledger + MATIC; Node 18+ and `npm install` in `docs/code/`.
2. **Hypothetical data**: Small test image + PDF; event JSON with fake but valid summary; genesis = real genesis Polygon hash.
3. **Order**: Genesis Polygon tx → supporting files to Arweave → provenance blob to Arweave → first Polygon anchor → (optional) second blob + second anchor.
4. **Verify**: Polygonscan (txs, 127-byte data); arweave.net (blobs and supports); optional local validation script.
5. **Safety**: Small amounts; hypothetical content only; optional dedicated test wallets.
