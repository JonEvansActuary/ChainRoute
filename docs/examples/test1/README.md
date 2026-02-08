# test1 – Hypothetical test data (3 sequential events)

Hypothetical supporting files and event JSON for a **3-event** mainnet test: **creation** → **transfer** → **certification**. All content is fictional and for protocol testing only.

## Supporting files

| File | Used in | Description |
|------|---------|-------------|
| [test-photo.jpg](./test-photo.jpg) | Event 1 (creation), Event 2 (transfer) | Minimal valid JPEG (1×1 pixel). |
| [test-invoice.pdf](./test-invoice.pdf) | Event 1 (creation), Event 2 (transfer) | Minimal PDF placeholder. |
| [test-certificate.txt](./test-certificate.txt) | Event 3 (certification) | Plain-text hypothetical certificate. |

Upload **photo** and **invoice** before event 1; upload **certificate** before event 3. Use the returned Arweave tx IDs in the event JSON `supports` arrays.

## Event JSON (placeholders)

Replace placeholders with real values when running the test:

| File | Event | Replace before use |
|------|--------|--------------------|
| [creation-event.json](./creation-event.json) | 1 – creation | `REPLACE_WITH_GENESIS_HASH_64_HEX`, `REPLACE_WITH_ARWEAVE_TX_ID_PHOTO`, `REPLACE_WITH_ARWEAVE_TX_ID_INVOICE` |
| [transfer-event.json](./transfer-event.json) | 2 – transfer | `REPLACE_WITH_GENESIS_HASH_64_HEX`, same photo/invoice Arweave IDs from event 1 |
| [certification-event.json](./certification-event.json) | 3 – certification | `REPLACE_WITH_GENESIS_HASH_64_HEX`, `REPLACE_WITH_ARWEAVE_TX_ID_CERTIFICATE` (from uploading test-certificate.txt) |

**Genesis**: Use the 64-hex Polygon transaction hash from your genesis tx (no `0x`).

**Support IDs**: 43-character Arweave transaction IDs from `post-support-to-arweave.js` (or from `post-event.js` output when using one-shot).

## 3-event flow

1. **Genesis** (Polygon): Post genesis tx; record **GENESIS_HASH**.
2. **Event 1 – Creation**
   - Upload `test-photo.jpg` and `test-invoice.pdf` to Arweave (with `--genesis GENESIS_HASH`); record tx IDs.
   - Fill `creation-event.json` with GENESIS_HASH and those two Arweave IDs.
   - Post provenance blob; post Polygon anchor (prev = 64 zero hex). Record **POLYGON_HASH_1**.
3. **Event 2 – Transfer**
   - Fill `transfer-event.json` with GENESIS_HASH and same photo/invoice Arweave IDs (no new uploads).
   - Post blob; post Polygon anchor (prev = **POLYGON_HASH_1**). Record **POLYGON_HASH_2**.
4. **Event 3 – Certification**
   - Upload `test-certificate.txt` to Arweave; record tx ID.
   - Fill `certification-event.json` with GENESIS_HASH and certificate Arweave ID.
   - Post blob; post Polygon anchor (prev = **POLYGON_HASH_2**).

See [mainnet-test-plan.md](./mainnet-test-plan.md) for full commands, verification, and safety notes.
