# Hypothetica Painting – Six-stage provenance example

Hypothetical provenance sequence for a **rare fine art painting** (valued ~$8–12 million), following the outline in [HypPaintOutline.txt](./HypPaintOutline.txt). All data is **fictional** and for protocol demonstration only.

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

All supporting files live in [supports/](./supports/). They are **minimal placeholders** (tiny JPEGs, minimal PDFs, short .txt) so the structure and filenames match the outline; replace with real content if you need realistic artifacts.

## Running the sequence

1. Post **genesis** Polygon tx; set **GENESIS_HASH**.
2. For each stage in order (1 → 6):
   - Upload that stage’s supporting files from `supports/` to Arweave (with `--genesis GENESIS_HASH`); record each 43-char Arweave tx ID.
   - In that stage’s event JSON, set `genesis` to GENESIS_HASH and each `supports[].id` to the corresponding Arweave ID.
   - Post the provenance blob (e.g. `post-provenance-blob-to-arweave.js`); then post the Polygon anchor with prev = previous stage’s Polygon tx hash (use 64 zero hex for the first event after genesis).

See [test1/mainnet-test-plan.md](../test1/mainnet-test-plan.md) for commands, verification, and safety.
