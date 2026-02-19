# HypotheticalPaintingRevised – Transaction IDs (Polygon & Arweave)

Record of successful transactions for this example chain. Use these when running later events (e.g. Event 2’s `previousPolygonHash` = Event 1 Polygon hash below).

**Genesis hash (64 hex, no `0x`)** — use for Arweave tags and all payloads:
```
647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc
```

---

## Polygon (anchors)

| Step     | Tx hash (0x) | 64 hex (for next step’s prev hash) |
|----------|--------------|-------------------------------------|
| Genesis  | `0x647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc` | `647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc` |
| Event 1  | `0x81d4f6cbae65445974157382f8040d43785e47a3ed092332af6a83c41eadc652` | `81d4f6cbae65445974157382f8040d43785e47a3ed092332af6a83c41eadc652` |
| Event 2  | `0xf5d1acd1ada1f113830ea236280b602d86580b5cb18f8c69098e732cf6dab97c` | `f5d1acd1ada1f113830ea236280b602d86580b5cb18f8c69098e732cf6dab97c` |
| Event 3  | `0xe8f94f3b626cf0071eebdf2685d7990af6aefe423550cad1b99bdc525ca8ad41` | `e8f94f3b626cf0071eebdf2685d7990af6aefe423550cad1b99bdc525ca8ad41` |
| Event 4  | `0x9acf7a7c0e26c5eda439b8f4c78a08429764644452e8f2e1e7ead733cdeee6a0` | `9acf7a7c0e26c5eda439b8f4c78a08429764644452e8f2e1e7ead733cdeee6a0` |
| Event 5  | `0xdd6c1cad1b8bb603f45f1209d67b39ecfc560e2e5482296cb142bc87efc60240` | `dd6c1cad1b8bb603f45f1209d67b39ecfc560e2e5482296cb142bc87efc60240` |
| Event 6  | `0xbb65b7600091790c123d42f1d2b613ea4b2b091102c3866384014e152f8f391a` | `bb65b7600091790c123d42f1d2b613ea4b2b091102c3866384014e152f8f391a` |

- For any step, use the previous row’s 64-hex hash as `previousPolygonHash`.

---

## Arweave

### How to verify on Arweave

Gateways can be slow or vary by region. Try these (replace `<TX_ID>` with any Arweave tx ID below):

| What | URL pattern | Example for Event 1 blob |
|------|-------------|---------------------------|
| **ViewBlock** (tx details + link to data) | `https://viewblock.io/arweave/tx/<TX_ID>` | [viewblock.io/arweave/tx/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU](https://viewblock.io/arweave/tx/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU) |
| **arweave.net** (content) | `https://arweave.net/<TX_ID>` | [arweave.net/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU](https://arweave.net/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU) |
| **arweave.net raw** | `https://arweave.net/raw/<TX_ID>` | [arweave.net/raw/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU](https://arweave.net/raw/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU) |
| **arweave.dev** (alternate gateway) | `https://arweave.dev/<TX_ID>` | [arweave.dev/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU](https://arweave.dev/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU) |

If one gateway times out or fails, try another. ViewBlock is usually reliable for confirming a tx exists; use the others to view the actual JSON or file content.

### Event 1

- **Provenance blob (main event):** `Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU`  
  - ViewBlock: https://viewblock.io/arweave/tx/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU  
  - Content: https://arweave.net/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU or https://arweave.dev/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU

- **Supporting files:** see [event1-supports.json](./event1-supports.json). Use the same URL patterns with each tx ID to open the image/PDF.

| Label                          | Arweave tx ID | View (ViewBlock) |
|--------------------------------|---------------|------------------|
| UV_Analysis_Picasso_Hypothetical | `yNWKjYl0-KjS-f0MGgvroozxn9E2CcpB5QMhmh9cAP8` | [view](https://viewblock.io/arweave/tx/yNWKjYl0-KjS-f0MGgvroozxn9E2CcpB5QMhmh9cAP8) |
| Spectral_Analysis_Report_v1     | `Nnf7KajxrNcx4zfI4-p66HBiiIJuosARpQjmZ2CpiLI` | [view](https://viewblock.io/arweave/tx/Nnf7KajxrNcx4zfI4-p66HBiiIJuosARpQjmZ2CpiLI) |
| Notary_Seal_Paris               | `5MOCV6Gys5kao9diUMlEh1NdTvk_K29ylk8k1o_EsIs` | [view](https://viewblock.io/arweave/tx/5MOCV6Gys5kao9diUMlEh1NdTvk_K29ylk8k1o_EsIs) |
| ArtSecure_Cert_12345           | `Q2x_x6g4H7YoDAf3PkJyxspGbzN0VwevdDsNwPCw1Mw` | [view](https://viewblock.io/arweave/tx/Q2x_x6g4H7YoDAf3PkJyxspGbzN0VwevdDsNwPCw1Mw) |
| Fictional_Picasso              | `REPLACE_ARWEAVE_ID_FICTIONAL_PICASSO` (upload when running flow) | — |

### Event 2 (Secure Transport)

- **Provenance blob:** `XhNLpcCR5WvlxCa5IgKQYBJy2FHX3YSm6MOZnvECD78` — [event2-supports.json](./event2-supports.json): Crate_Photo_Paris, Flight_Manifest_AF034, Insurance_Policy_8M, Customs_Clearance_JFK

### Event 3 (Auction Drop-Off)

- **Provenance blob:** `rpCsFRLH-Ocbi0lflgfZaVPc0sE_mtxiQXPrYLDsrhU` — [event3-supports.json](./event3-supports.json): DropOff_Photo_Manhattan, Condition_Report_NY, Receipt_AuctionHouse, Security_Log_Entry

### Event 4 (Live Bidding)

- **Provenance blob:** `DO9EMjJC8G_9g0CfDfyqko0ODQ4IAiO0QgtpabZ0580` — [event4-supports.json](./event4-supports.json): Bidding_Event_Photo, Sale_Transcript, Transaction_Receipt_12M, Buyer_Agreement_Redacted

### Event 5 (Secure Handover)

- **Provenance blob:** `JhIZvFI-og1p1Ux9rYEDavfE_5tqiSkSVKxQ0spb_o8` — [event5-supports.json](./event5-supports.json): Handover_Photo_London, Transfer_Documents, Jet_Manifest, Vault_Entry_Log

### Event 6 (Long-Term Storage)

- **Provenance blob:** `dj-IWkTn2z9zsSs0id_nS1_Um3NiM2yFiqB5Tjsnqoc` — [event6-supports.json](./event6-supports.json): Storage_Photo_Vault, Climate_Control_Report, Access_Log_Initial, Insurance_Update_PostSale

---

*Full chain (Genesis + Events 1–6) posted. Use the 64-hex hashes above for verification or replay.*

---

## Verifying references (Polygon + Arweave)

Run the chain verifier to confirm that every Polygon anchor has the correct genesis hash, previous tx hash, Arweave blob ID, and delegate, and that every Arweave blob has the correct genesis and support IDs:

```bash
node docs/code/verify-chain.js ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json
```

Optional: `--rpc <polygon-rpc>` and `--arweave-gateway <url>` (defaults: PublicNode Polygon, arweave.net).

To verify that every support file has the `ChainRoute-Genesis` tag set correctly:

```bash
node docs/code/verify-support-tags.js ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json
```

Optional: `--gateway <url>` (default: arweave.net). This queries Arweave GraphQL for each support tx and checks the tag.
