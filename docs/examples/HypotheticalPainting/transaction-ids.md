# HypotheticalPainting – Transaction IDs (Polygon & Arweave)

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

- **Event 2** and later: use the previous row’s 64-hex hash as `previousPolygonHash`.

---

## Arweave

### Event 1

- **Provenance blob (main event):** `Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU`  
  - https://arweave.net/Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU

- **Supporting files:** see [event1-supports.json](./event1-supports.json).

| Label                          | Arweave tx ID |
|--------------------------------|---------------|
| UV_Analysis_Picasso_Hypothetical | `yNWKjYl0-KjS-f0MGgvroozxn9E2CcpB5QMhmh9cAP8` |
| Spectral_Analysis_Report_v1     | `Nnf7KajxrNcx4zfI4-p66HBiiIJuosARpQjmZ2CpiLI` |
| Notary_Seal_Paris               | `5MOCV6Gys5kao9diUMlEh1NdTvk_K29ylk8k1o_EsIs` |
| ArtSecure_Cert_12345           | `Q2x_x6g4H7YoDAf3PkJyxspGbzN0VwevdDsNwPCw1Mw` |

---

*Update this file as you post Event 2–6 (add Polygon hashes and Arweave blob/support IDs).*
