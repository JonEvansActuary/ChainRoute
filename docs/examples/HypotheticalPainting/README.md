# Hypothetical Painting – Six-stage provenance example

Hypothetical provenance sequence for a **rare fine art painting** (valued ~$8–12 million), following the outline in [HypPaintOutline.txt](./HypPaintOutline.txt). All data is **fictional** and for protocol demonstration only. Fictional signers for each of the 7 Polygon transactions are listed in [PolygonEventSigners.json](./PolygonEventSigners.json) (event name, signer name, role, Polygon address).

**Slide deck (general audience):** [HypotheticalPainting-Slides.html](./HypotheticalPainting-Slides.html) — open in a browser for a presentation with stage summaries and fictional supporting-image placeholders. Scroll or swipe to advance. Clearly labeled as a fictional example.

## Outline → events and supports

| Stage | Outline (HypPaintOutline.txt) | Main provenance event | Supporting files |
|-------|-------------------------------|------------------------|------------------|
| 1 | Authentication | [1-authentication.json](./1-authentication.json) (certification) | [supports/](./supports/): UV_Analysis_Picasso_Hypothetical.png, Spectral_Analysis_Report_v1.pdf, Notary_Seal_Paris.png, ArtSecure_Cert_12345.pdf |
| 2 | Secure Transport | [2-secure-transport.json](./2-secure-transport.json) (transfer) | Crate_Photo_Paris.png, Flight_Manifest_AF034.pdf, Insurance_Policy_8M.pdf, Customs_Clearance_JFK.png |
| 3 | Auction Drop-Off | [3-auction-dropoff.json](./3-auction-dropoff.json) (transfer) | DropOff_Photo_Manhattan.png, Condition_Report_NY.pdf, Receipt_AuctionHouse.pdf, Security_Log_Entry.txt |
| 4 | Live Bidding Event | [4-live-bidding.json](./4-live-bidding.json) (transfer) | Bidding_Event_Photo.png, Sale_Transcript.pdf, Transaction_Receipt_12M.pdf, Buyer_Agreement_Redacted.pdf |
| 5 | Secure Handover | [5-secure-handover.json](./5-secure-handover.json) (transfer) | Handover_Photo_London.png, Transfer_Documents.pdf, Jet_Manifest.pdf, Vault_Entry_Log.txt |
| 6 | Long-Term Storage | [6-long-term-storage.json](./6-long-term-storage.json) (certification) | Storage_Photo_Vault.png, Climate_Control_Report.pdf, Access_Log_Initial.txt, Insurance_Update_PostSale.pdf |

## Event JSON (placeholders)

Each event file has:

- **genesis**: Replace `REPLACE_WITH_GENESIS_HASH_64_HEX` with your 64-hex Polygon genesis tx hash (no `0x`).
- **supports**: Replace each `REPLACE_ARWEAVE_ID_*` with the 43-character Arweave transaction ID returned after uploading that supporting file (e.g. via `post-support-to-arweave.js` with `--genesis GENESIS_HASH`).

Event types: **certification** (stages 1 and 6), **transfer** (stages 2–5). Timestamps and summaries match the outline (Paris → New York → London).

## Supporting files

All supporting files live in [supports/](./supports/). They are **minimal placeholders** (tiny images, minimal PDFs, short .txt) so the structure and filenames match the outline; replace with real content if you need realistic artifacts.

## Polygon anchor payloads (127-byte tx data)

Each Arweave provenance step is anchored on Polygon with a 127-byte payload built from a JSON file. Layout matches [protocol.md §3.1](../../protocol.md#31-polygon-transaction-payload): 32 + 32 + 43 + 20 = 127 bytes.

| Offset  | Field (in JSON)       | Size (bytes) | In payload JSON |
|---------|------------------------|--------------|------------------|
| 0–31    | genesisHash            | 32           | 64 hex chars (e.g. 64 zero hex for genesis) |
| 32–63   | previousPolygonHash    | 32           | 64 hex chars (64 zero hex for genesis and for first event) |
| 64–106  | arweaveId              | 43           | 43-char UTF-8 string (Arweave tx ID), or `0` for genesis → 43 zero bytes |
| 107–126 | delegate               | 20           | `0x` + 40 hex chars (Ethereum-style address) |

This folder includes one payload JSON per step:

| Step | Payload JSON | Notes |
|------|--------------|--------|
| Genesis | [genesis-payload.json](./genesis-payload.json) | `arweaveId` = 0 (43 zero bytes); `previousPolygonHash` = 64 zero hex. |
| Event 1 | [1-authentication-payload.json](./1-authentication-payload.json) | `previousPolygonHash` = 64 zero hex (first event after genesis). |
| Event 2 | [2-secure-transport-payload.json](./2-secure-transport-payload.json) | Set `previousPolygonHash` = Polygon tx hash of event 1. |
| Event 3 | [3-auction-dropoff-payload.json](./3-auction-dropoff-payload.json) | Set `previousPolygonHash` = Polygon tx hash of event 2. |
| Event 4 | [4-live-bidding-payload.json](./4-live-bidding-payload.json) | Set `previousPolygonHash` = Polygon tx hash of event 3. |
| Event 5 | [5-secure-handover-payload.json](./5-secure-handover-payload.json) | Set `previousPolygonHash` = Polygon tx hash of event 4. |
| Event 6 | [6-long-term-storage-payload.json](./6-long-term-storage-payload.json) | Set `previousPolygonHash` = Polygon tx hash of event 5. |

Payload fields: **genesisHash** (32 bytes → 64 hex), **previousPolygonHash** (32 bytes → 64 hex), **arweaveId** (43 bytes → 43-char string, or `0` for genesis), **delegate** (20 bytes → `0x` + 40 hex). Build the 127-byte hex with:

```bash
node docs/code/build-polygon-payload.js docs/examples/HypotheticalPainting/<payload-file>.json
```

Before running: set **genesisHash** to your genesis Polygon tx hash (64 hex), **previousPolygonHash** to the previous step’s Polygon tx hash (64 zero hex for genesis and for event 1), **arweaveId** to the 43-char Arweave blob ID for that event (after posting the event blob), and **delegate** to the controller address.

## Running the sequence

1. Post **genesis** Polygon tx using [genesis-payload.json](./genesis-payload.json); set **GENESIS_HASH** (64 hex).
2. For each stage in order (1 → 6):
   - Upload that stage’s supporting files from `supports/` to Arweave (with `--genesis GENESIS_HASH`); record each 43-char Arweave tx ID.
   - In that stage’s event JSON, set `genesis` to GENESIS_HASH and each `supports[].id` to the corresponding Arweave ID.
   - Post the provenance blob (e.g. `post-provenance-blob-to-arweave.js`); record the 43-char Arweave blob ID.
   - In the matching `*-payload.json`, set `genesisHash`, `previousPolygonHash` (previous step’s Polygon tx hash), `arweaveId` (this event’s blob ID), and `delegate`; then build and post the Polygon anchor with `build-polygon-payload.js`.

See [docs/code](../code/) for posting scripts and commands; a [mainnet test plan](../test1/mainnet-test-plan.md) may exist under `examples/test1/` for detailed verification and safety.
