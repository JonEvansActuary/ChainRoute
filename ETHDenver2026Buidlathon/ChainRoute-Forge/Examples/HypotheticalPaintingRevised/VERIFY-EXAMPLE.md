# ChainRoute Protocol -- Live Verification Reference

**Hypothetical Painting: A Six-Stage Provenance Example on Polygon Mainnet + Arweave**

This document lets you independently verify a complete ChainRoute provenance chain using nothing but a web browser and public block explorers. No code, no tooling, no repo clone required.

All data in this example is **fictional** and exists solely to demonstrate the ChainRoute protocol. The item is a hypothetical Picasso painting tracked through six provenance stages -- from authentication in Paris, through auction in New York, to long-term vault storage in London -- each signed by a different party on Polygon and anchored with permanent evidence on Arweave.

---

## Genesis Hash (Entry Point)

Everything starts here. This is the Polygon transaction hash that anchors the entire chain:

```
b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94
```

PolygonScan: [0xb1861b01...aa94](https://polygonscan.com/tx/0xb1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94)

---

## The Provenance Story

| Step | Event | Signer | Role |
|------|-------|--------|------|
| Genesis | Chain creation | Sebastien Moreau | Director, Fondation Hypothetique (artist's estate) |
| 1 | Authentication | Dr. Elena Vasquez | Chief Authenticator, ArtSecure Paris |
| 2 | Secure Transport | Marcus Webb | Head of Security, Palladium Art Logistics |
| 3 | Auction Drop-Off | Victoria Chen | Registrar, Christie's New York |
| 4 | Live Bidding | James Okonkwo | Buyer's legal counsel |
| 5 | Secure Handover | Marcus Webb | Head of Security, Palladium Art Logistics |
| 6 | Long-Term Storage | Dame Eleanor Ashford | Director, Sterling Vaults London |

Each signer was delegated authority by the previous signer (recorded on-chain). Event 6 self-delegates, ending the chain.

---

## How ChainRoute Works (The 127-Byte Payload)

Every Polygon transaction in the chain carries exactly **127 bytes** of data in its input field. No smart contract -- just raw bytes in a self-send transaction. The layout:

| Bytes | Field | Size | What it contains |
|-------|-------|------|------------------|
| 0--31 | Genesis Hash | 32 bytes | The chain's root tx hash (all zeros for the genesis tx itself) |
| 32--63 | Previous Hash | 32 bytes | Hash of the prior Polygon tx (links the chain backward) |
| 64--106 | Arweave ID | 43 bytes | The Arweave transaction ID of the provenance data blob (43 zero bytes for genesis) |
| 107--126 | Delegate | 20 bytes | Ethereum address of the next authorized signer |

To verify: open any transaction on PolygonScan, click "Input Data", view as hex. The first 64 hex chars are the genesis hash, the next 64 are the previous hash, the next 86 hex chars decode to a 43-character Arweave ID (UTF-8), and the final 40 hex chars are the delegate address.

---

## Verifying the Polygon Chain (7 Transactions)

Open each link on PolygonScan. Under "Input Data" you can see the 127-byte payload. Confirm that:
- The **genesis hash** matches the chain root (all zeros for the genesis tx, then `b1861b01...aa94` for all subsequent txs)
- The **previous hash** matches the tx hash of the step before it
- The **Arweave ID** matches the blob ID listed below (verifiable on Arweave)
- The **delegate** address matches the signer of the next step

### Genesis

- **Tx:** [0xb1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94](https://polygonscan.com/tx/0xb1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94)
- **Signer:** `0x637c48475bc7c9af5c2001faf41feb529364d112` (Sebastien Moreau)
- **Genesis Hash:** `0000...0000` (32 zero bytes -- this is the genesis itself)
- **Previous Hash:** `0000...0000` (no predecessor)
- **Arweave ID:** (43 zero bytes -- no blob for genesis)
- **Delegate:** `0x8db69f820004eb12a01c7ede5e269e5561202512` (Dr. Elena Vasquez -- Event 1 signer)

### Event 1 -- Authentication (Paris)

- **Tx:** [0x6b01ed4c4f30d122366678db4ebe2bd774ff6062e3d9b94b09e5e1968bdb0300](https://polygonscan.com/tx/0x6b01ed4c4f30d122366678db4ebe2bd774ff6062e3d9b94b09e5e1968bdb0300)
- **Signer:** `0x8db69f820004eb12a01c7ede5e269e5561202512` (Dr. Elena Vasquez)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94` (genesis)
- **Arweave Blob:** `vLsZPb2EO-a6M31yKZ0-muqygP0oSmUDKho6YotGOoA` -- [view JSON](https://arweave.net/vLsZPb2EO-a6M31yKZ0-muqygP0oSmUDKho6YotGOoA)
- **Delegate:** `0xab6cb77a629b56f5d9efd131404ebf692d4a7371` (Marcus Webb -- Event 2 signer)

### Event 2 -- Secure Transport (Paris to New York)

- **Tx:** [0x098d65abc09a70b4908b71395f2975502dc94788a7286d20c51cf3f04464a76f](https://polygonscan.com/tx/0x098d65abc09a70b4908b71395f2975502dc94788a7286d20c51cf3f04464a76f)
- **Signer:** `0xab6cb77a629b56f5d9efd131404ebf692d4a7371` (Marcus Webb)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `6b01ed4c4f30d122366678db4ebe2bd774ff6062e3d9b94b09e5e1968bdb0300` (Event 1)
- **Arweave Blob:** `TdBumkRk80QzQM6NZh7ORglTPSF9xx7lJpvoMqBgFTQ` -- [view JSON](https://arweave.net/TdBumkRk80QzQM6NZh7ORglTPSF9xx7lJpvoMqBgFTQ)
- **Delegate:** `0xbf411ced6f35c8125ba6b146615276b43ebaaa91` (Victoria Chen -- Event 3 signer)

### Event 3 -- Auction Drop-Off (New York)

- **Tx:** [0x9400fbdd3da29906637755a55e7ccf4bed73e8c6b7cf3bdf2a5a501cbfcc8f26](https://polygonscan.com/tx/0x9400fbdd3da29906637755a55e7ccf4bed73e8c6b7cf3bdf2a5a501cbfcc8f26)
- **Signer:** `0xbf411ced6f35c8125ba6b146615276b43ebaaa91` (Victoria Chen)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `098d65abc09a70b4908b71395f2975502dc94788a7286d20c51cf3f04464a76f` (Event 2)
- **Arweave Blob:** `AaJwmoZV83nRCQuB2KTIzQcy_iBGLjYJEhXMoFgP__4` -- [view JSON](https://arweave.net/AaJwmoZV83nRCQuB2KTIzQcy_iBGLjYJEhXMoFgP__4)
- **Delegate:** `0x23439a839f0b6710e0dee4c4a9788b06d0e72a8a` (James Okonkwo -- Event 4 signer)

### Event 4 -- Live Bidding (New York)

- **Tx:** [0xc1e2da7531dd9876141d6cf772771cfe9cddbe08ce0e6226078cbb8a4992c9bf](https://polygonscan.com/tx/0xc1e2da7531dd9876141d6cf772771cfe9cddbe08ce0e6226078cbb8a4992c9bf)
- **Signer:** `0x23439a839f0b6710e0dee4c4a9788b06d0e72a8a` (James Okonkwo)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `9400fbdd3da29906637755a55e7ccf4bed73e8c6b7cf3bdf2a5a501cbfcc8f26` (Event 3)
- **Arweave Blob:** `XrqThWfVEgLSUM4W4xh7TnGXyVIRHLi34W0qf243b78` -- [view JSON](https://arweave.net/XrqThWfVEgLSUM4W4xh7TnGXyVIRHLi34W0qf243b78)
- **Delegate:** `0xa54df49497fff3e331ed4c5fe6e6d64be01fe606` (Marcus Webb -- Event 5 signer)

### Event 5 -- Secure Handover (New York to London)

- **Tx:** [0x5ed9e0c8dd332c56bbd31f63d9b62e36b0ecedcf6c504628ef0fc1474eced46c](https://polygonscan.com/tx/0x5ed9e0c8dd332c56bbd31f63d9b62e36b0ecedcf6c504628ef0fc1474eced46c)
- **Signer:** `0xa54df49497fff3e331ed4c5fe6e6d64be01fe606` (Marcus Webb)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `c1e2da7531dd9876141d6cf772771cfe9cddbe08ce0e6226078cbb8a4992c9bf` (Event 4)
- **Arweave Blob:** `jIgJcuU7rdL1YIy3g3-zK6sLCDMSF02C6aYbh4LjR2g` -- [view JSON](https://arweave.net/jIgJcuU7rdL1YIy3g3-zK6sLCDMSF02C6aYbh4LjR2g)
- **Delegate:** `0x83abb8781f4535ca1820bd2fa9fb95059c0c02cf` (Dame Eleanor Ashford -- Event 6 signer)

### Event 6 -- Long-Term Storage (London)

- **Tx:** [0xc7b5adf7ee5afbaa6fd4a80eea7e00b7fc6d08d2a9e6fb0dd6aef9124f44345b](https://polygonscan.com/tx/0xc7b5adf7ee5afbaa6fd4a80eea7e00b7fc6d08d2a9e6fb0dd6aef9124f44345b)
- **Signer:** `0x83abb8781f4535ca1820bd2fa9fb95059c0c02cf` (Dame Eleanor Ashford)
- **Genesis Hash:** `b1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94`
- **Previous Hash:** `5ed9e0c8dd332c56bbd31f63d9b62e36b0ecedcf6c504628ef0fc1474eced46c` (Event 5)
- **Arweave Blob:** `kKdHYqKkXI86TvOr1DcNkrjtygQTWzDPx1UeS2e3sxY` -- [view JSON](https://arweave.net/kKdHYqKkXI86TvOr1DcNkrjtygQTWzDPx1UeS2e3sxY)
- **Delegate:** `0x83abb8781f4535ca1820bd2fa9fb95059c0c02cf` (self-delegate -- chain ends)

---

## Verifying the Arweave Data (31 Transactions)

Each Arweave provenance blob is a JSON document containing the genesis hash, event type, timestamp, a summary of the event, and references to supporting evidence files (images, PDFs, text). Each support file is tagged with `ChainRoute-Genesis` linking it back to the chain.

Click any "view JSON" link above to see the provenance blob. Click any support link below to view the file directly (images render in-browser; PDFs download). To check tags on support files, use ViewBlock.

### Event 1 -- Authentication (5 support files)

**Provenance blob:** [vLsZPb2EO-a6M31yKZ0-muqygP0oSmUDKho6YotGOoA](https://arweave.net/vLsZPb2EO-a6M31yKZ0-muqygP0oSmUDKho6YotGOoA) ([ViewBlock](https://viewblock.io/arweave/tx/vLsZPb2EO-a6M31yKZ0-muqygP0oSmUDKho6YotGOoA))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| UV Analysis (image) | [eJpxHmwgDyd76ojM8FJnJEsiR3gs1fmuBZFvKkGRby0](https://arweave.net/eJpxHmwgDyd76ojM8FJnJEsiR3gs1fmuBZFvKkGRby0) | [tags](https://viewblock.io/arweave/tx/eJpxHmwgDyd76ojM8FJnJEsiR3gs1fmuBZFvKkGRby0) |
| Spectral Analysis Report (PDF) | [dNot0BdabhaUkG6qRaEEV8WSqiRiAOtclxghhu7TmmE](https://arweave.net/dNot0BdabhaUkG6qRaEEV8WSqiRiAOtclxghhu7TmmE) | [tags](https://viewblock.io/arweave/tx/dNot0BdabhaUkG6qRaEEV8WSqiRiAOtclxghhu7TmmE) |
| Notary Seal Paris (image) | [SfcHDoMwR2mlGa2kkmC6Uk0tJE9prDZv93q_hTn1nj4](https://arweave.net/SfcHDoMwR2mlGa2kkmC6Uk0tJE9prDZv93q_hTn1nj4) | [tags](https://viewblock.io/arweave/tx/SfcHDoMwR2mlGa2kkmC6Uk0tJE9prDZv93q_hTn1nj4) |
| ArtSecure Certificate (PDF) | [jvdYgoep_N_wqQrXboXCqMf4TaFYANRiM_W8okxlmag](https://arweave.net/jvdYgoep_N_wqQrXboXCqMf4TaFYANRiM_W8okxlmag) | [tags](https://viewblock.io/arweave/tx/jvdYgoep_N_wqQrXboXCqMf4TaFYANRiM_W8okxlmag) |
| Fictional Picasso (image) | [qJBpK0OHjsAt3-VnzfXct-d1ki0AvzngBA6mRSl-uH8](https://arweave.net/qJBpK0OHjsAt3-VnzfXct-d1ki0AvzngBA6mRSl-uH8) | [tags](https://viewblock.io/arweave/tx/qJBpK0OHjsAt3-VnzfXct-d1ki0AvzngBA6mRSl-uH8) |

### Event 2 -- Secure Transport (4 support files)

**Provenance blob:** [TdBumkRk80QzQM6NZh7ORglTPSF9xx7lJpvoMqBgFTQ](https://arweave.net/TdBumkRk80QzQM6NZh7ORglTPSF9xx7lJpvoMqBgFTQ) ([ViewBlock](https://viewblock.io/arweave/tx/TdBumkRk80QzQM6NZh7ORglTPSF9xx7lJpvoMqBgFTQ))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| Crate Photo Paris (image) | [hAtGeJontFO1ClQAZWgKJCquWFmAERfr9EZLqQy2oKI](https://arweave.net/hAtGeJontFO1ClQAZWgKJCquWFmAERfr9EZLqQy2oKI) | [tags](https://viewblock.io/arweave/tx/hAtGeJontFO1ClQAZWgKJCquWFmAERfr9EZLqQy2oKI) |
| Flight Manifest AF034 (PDF) | [KVMBSp02TCacYBUBnG8tyfAN3E34M4KtxfUvMBZdTos](https://arweave.net/KVMBSp02TCacYBUBnG8tyfAN3E34M4KtxfUvMBZdTos) | [tags](https://viewblock.io/arweave/tx/KVMBSp02TCacYBUBnG8tyfAN3E34M4KtxfUvMBZdTos) |
| Insurance Policy $8M (PDF) | [77NqcIHelN57txcBtNNS6UtAsypj8PhpegkEaDmMDsY](https://arweave.net/77NqcIHelN57txcBtNNS6UtAsypj8PhpegkEaDmMDsY) | [tags](https://viewblock.io/arweave/tx/77NqcIHelN57txcBtNNS6UtAsypj8PhpegkEaDmMDsY) |
| Customs Clearance JFK (image) | [M3RCXmVBW08oNSIKKVxkS21aBGScmCes8npEZcgwxKQ](https://arweave.net/M3RCXmVBW08oNSIKKVxkS21aBGScmCes8npEZcgwxKQ) | [tags](https://viewblock.io/arweave/tx/M3RCXmVBW08oNSIKKVxkS21aBGScmCes8npEZcgwxKQ) |

### Event 3 -- Auction Drop-Off (4 support files)

**Provenance blob:** [AaJwmoZV83nRCQuB2KTIzQcy_iBGLjYJEhXMoFgP__4](https://arweave.net/AaJwmoZV83nRCQuB2KTIzQcy_iBGLjYJEhXMoFgP__4) ([ViewBlock](https://viewblock.io/arweave/tx/AaJwmoZV83nRCQuB2KTIzQcy_iBGLjYJEhXMoFgP__4))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| Drop-Off Photo Manhattan (image) | [yJC-4UJRb09kP4wsYliFtLfKBsBbswAZg761MekC0gM](https://arweave.net/yJC-4UJRb09kP4wsYliFtLfKBsBbswAZg761MekC0gM) | [tags](https://viewblock.io/arweave/tx/yJC-4UJRb09kP4wsYliFtLfKBsBbswAZg761MekC0gM) |
| Condition Report NY (PDF) | [hHgh_Y7kYFTWBo5ZNujxR3wKTPhtSAv_kjGoF5L34hE](https://arweave.net/hHgh_Y7kYFTWBo5ZNujxR3wKTPhtSAv_kjGoF5L34hE) | [tags](https://viewblock.io/arweave/tx/hHgh_Y7kYFTWBo5ZNujxR3wKTPhtSAv_kjGoF5L34hE) |
| Receipt Auction House (PDF) | [zmpmOJ-YbXO9swG3qeNtzoApl9Yy4SAtRYpAA8hGjGw](https://arweave.net/zmpmOJ-YbXO9swG3qeNtzoApl9Yy4SAtRYpAA8hGjGw) | [tags](https://viewblock.io/arweave/tx/zmpmOJ-YbXO9swG3qeNtzoApl9Yy4SAtRYpAA8hGjGw) |
| Security Log Entry (text) | [-Djd5He3RfT387eGDCQ_hVJc0vnvB1_5CgNqxI0yMYs](https://arweave.net/-Djd5He3RfT387eGDCQ_hVJc0vnvB1_5CgNqxI0yMYs) | [tags](https://viewblock.io/arweave/tx/-Djd5He3RfT387eGDCQ_hVJc0vnvB1_5CgNqxI0yMYs) |

### Event 4 -- Live Bidding (4 support files)

**Provenance blob:** [XrqThWfVEgLSUM4W4xh7TnGXyVIRHLi34W0qf243b78](https://arweave.net/XrqThWfVEgLSUM4W4xh7TnGXyVIRHLi34W0qf243b78) ([ViewBlock](https://viewblock.io/arweave/tx/XrqThWfVEgLSUM4W4xh7TnGXyVIRHLi34W0qf243b78))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| Bidding Event Photo (image) | [m5W8LHz1qjITtZqS9fmqjiF-s8b-z_yOS8JdyX138n0](https://arweave.net/m5W8LHz1qjITtZqS9fmqjiF-s8b-z_yOS8JdyX138n0) | [tags](https://viewblock.io/arweave/tx/m5W8LHz1qjITtZqS9fmqjiF-s8b-z_yOS8JdyX138n0) |
| Sale Transcript (PDF) | [wlEkfua5lUd_al_rGepmZ5XQ_zfK-vg64-qQirdmhlk](https://arweave.net/wlEkfua5lUd_al_rGepmZ5XQ_zfK-vg64-qQirdmhlk) | [tags](https://viewblock.io/arweave/tx/wlEkfua5lUd_al_rGepmZ5XQ_zfK-vg64-qQirdmhlk) |
| Transaction Receipt $12M (PDF) | [pOh8w8Gs93oa-tcVriedKpwP0CIiyUt4PqcBMHe86xE](https://arweave.net/pOh8w8Gs93oa-tcVriedKpwP0CIiyUt4PqcBMHe86xE) | [tags](https://viewblock.io/arweave/tx/pOh8w8Gs93oa-tcVriedKpwP0CIiyUt4PqcBMHe86xE) |
| Buyer Agreement (PDF) | [xuE4p81OfPxWy4gpUqTGm39UDOKWW97Xyz8lWstgK-E](https://arweave.net/xuE4p81OfPxWy4gpUqTGm39UDOKWW97Xyz8lWstgK-E) | [tags](https://viewblock.io/arweave/tx/xuE4p81OfPxWy4gpUqTGm39UDOKWW97Xyz8lWstgK-E) |

### Event 5 -- Secure Handover (4 support files)

**Provenance blob:** [jIgJcuU7rdL1YIy3g3-zK6sLCDMSF02C6aYbh4LjR2g](https://arweave.net/jIgJcuU7rdL1YIy3g3-zK6sLCDMSF02C6aYbh4LjR2g) ([ViewBlock](https://viewblock.io/arweave/tx/jIgJcuU7rdL1YIy3g3-zK6sLCDMSF02C6aYbh4LjR2g))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| Handover Photo London (image) | [YofMjDXrXpXkRbPb4gBa7m0yrdsFsH8TTMNwZochLT0](https://arweave.net/YofMjDXrXpXkRbPb4gBa7m0yrdsFsH8TTMNwZochLT0) | [tags](https://viewblock.io/arweave/tx/YofMjDXrXpXkRbPb4gBa7m0yrdsFsH8TTMNwZochLT0) |
| Transfer Documents (PDF) | [bELnYIlPLN-Lfadm1cLYLnluzLrB8a-dfx_3shV_OWM](https://arweave.net/bELnYIlPLN-Lfadm1cLYLnluzLrB8a-dfx_3shV_OWM) | [tags](https://viewblock.io/arweave/tx/bELnYIlPLN-Lfadm1cLYLnluzLrB8a-dfx_3shV_OWM) |
| Jet Manifest (PDF) | [drPQz9fAUh4gLwI3LNxmx7jKY081eALL_wskZSqsEJY](https://arweave.net/drPQz9fAUh4gLwI3LNxmx7jKY081eALL_wskZSqsEJY) | [tags](https://viewblock.io/arweave/tx/drPQz9fAUh4gLwI3LNxmx7jKY081eALL_wskZSqsEJY) |
| Vault Entry Log (text) | [jgkgBEowObFm6EtHiwbnNf-otmgdZiVWg1JkDg3XMGo](https://arweave.net/jgkgBEowObFm6EtHiwbnNf-otmgdZiVWg1JkDg3XMGo) | [tags](https://viewblock.io/arweave/tx/jgkgBEowObFm6EtHiwbnNf-otmgdZiVWg1JkDg3XMGo) |

### Event 6 -- Long-Term Storage (4 support files)

**Provenance blob:** [kKdHYqKkXI86TvOr1DcNkrjtygQTWzDPx1UeS2e3sxY](https://arweave.net/kKdHYqKkXI86TvOr1DcNkrjtygQTWzDPx1UeS2e3sxY) ([ViewBlock](https://viewblock.io/arweave/tx/kKdHYqKkXI86TvOr1DcNkrjtygQTWzDPx1UeS2e3sxY))

| File | Arweave link | ViewBlock |
|------|-------------|-----------|
| Storage Photo Vault (image) | [35047b8_2xSGXAsT3TDRUgeZnPX47pjoqd3U-jFxDSo](https://arweave.net/35047b8_2xSGXAsT3TDRUgeZnPX47pjoqd3U-jFxDSo) | [tags](https://viewblock.io/arweave/tx/35047b8_2xSGXAsT3TDRUgeZnPX47pjoqd3U-jFxDSo) |
| Climate Control Report (PDF) | [7tZEV69lnnuorS7ipyk_tygX5MZ6UkZMZgQqw3LorPo](https://arweave.net/7tZEV69lnnuorS7ipyk_tygX5MZ6UkZMZgQqw3LorPo) | [tags](https://viewblock.io/arweave/tx/7tZEV69lnnuorS7ipyk_tygX5MZ6UkZMZgQqw3LorPo) |
| Access Log (text) | [0m-4Ir63J4p-81SpIfJ87yQQOU8z97xelz0C--IFrU4](https://arweave.net/0m-4Ir63J4p-81SpIfJ87yQQOU8z97xelz0C--IFrU4) | [tags](https://viewblock.io/arweave/tx/0m-4Ir63J4p-81SpIfJ87yQQOU8z97xelz0C--IFrU4) |
| Insurance Update Post-Sale (PDF) | [7XDEIZDiCeroqg-7ThB0Cq51pI3mOYdaTpX2i9GProY](https://arweave.net/7XDEIZDiCeroqg-7ThB0Cq51pI3mOYdaTpX2i9GProY) | [tags](https://viewblock.io/arweave/tx/7XDEIZDiCeroqg-7ThB0Cq51pI3mOYdaTpX2i9GProY) |

---

## Manual Walkthrough: Verifying the Chain

### Forward traversal (follow the delegation)

1. Open the [genesis transaction](https://polygonscan.com/tx/0xb1861b01fbe3d14a9fc817c314103ef28b2a4a64753e73fe75bd90778a74aa94) on PolygonScan. Note the **From** address (`0x637c...d112`) and the delegate in the payload (`0x8db6...2512`).
2. The delegate is the signer of Event 1. Open [Event 1](https://polygonscan.com/tx/0x6b01ed4c4f30d122366678db4ebe2bd774ff6062e3d9b94b09e5e1968bdb0300) -- confirm **From** matches the delegate from the previous step.
3. Decode the Input Data. The first 64 hex chars should match the genesis hash. The next 64 should match the genesis tx hash (since Event 1 follows genesis directly).
4. Take the Arweave ID from the payload (bytes 64--106, decoded as UTF-8). Open it on `https://arweave.net/<ID>`. You should see a JSON document with `"genesis"` matching the chain root and a `"supports"` array listing the evidence files.
5. Click through each support ID in the JSON to view the actual images and documents on Arweave.
6. Continue to Event 2, 3, 4, 5, 6 -- at each step, verify the From address matches the previous step's delegate, and the previous hash matches the prior tx hash.

### Backward traversal (follow the prev-hash links)

1. Start at [Event 6](https://polygonscan.com/tx/0xc7b5adf7ee5afbaa6fd4a80eea7e00b7fc6d08d2a9e6fb0dd6aef9124f44345b). Decode the Input Data.
2. The previous hash field (bytes 32--63) gives you Event 5's tx hash. Prepend `0x` and open it on PolygonScan.
3. Repeat until you reach the genesis (previous hash is all zeros).

### Cross-chain verification

For any Polygon anchor, take the Arweave ID from its payload and open it:
- `https://arweave.net/<ARWEAVE_ID>` returns the provenance JSON
- The JSON's `"genesis"` field should match the chain's genesis hash
- The JSON's `"supports"` array lists Arweave IDs for every evidence file -- open each to view the original document
- On ViewBlock, check each support file's tags: `ChainRoute-Genesis` should equal the genesis hash

---

## Alternate Arweave Gateways

If `arweave.net` is slow or returns an error, try these alternates (replace `<TX_ID>`):

| Gateway | URL pattern |
|---------|-------------|
| arweave.net | `https://arweave.net/<TX_ID>` |
| arweave.dev | `https://arweave.dev/<TX_ID>` |
| ViewBlock (tx details + tags) | `https://viewblock.io/arweave/tx/<TX_ID>` |

---

## For Developers

To run automated verification, clone the [ChainRoute repo](https://github.com/) and run from the repo root:

```bash
# Verify all 7 Polygon payloads + 6 Arweave blobs
node docs/code/verify-chain.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json \
  --rpc https://polygon-bor-rpc.publicnode.com

# Verify all 25 support files have the correct ChainRoute-Genesis tag
node docs/code/verify-support-tags.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json
```

Full protocol specification: [protocol.md](../../../../protocol.md)

---

## Transaction Summary

| Category | Count | Where to verify |
|----------|-------|-----------------|
| Polygon anchor transactions | 7 (1 genesis + 6 events) | PolygonScan |
| Arweave provenance blobs | 6 | arweave.net / ViewBlock |
| Arweave support files | 25 | arweave.net / ViewBlock |
| **Total on-chain transactions** | **38** | |

All transactions are on **mainnet** (Polygon chain ID 137, Arweave mainnet). Nothing here is on a testnet.

---

*ChainRoute -- ETHDenver 2026 Buidlathon*
