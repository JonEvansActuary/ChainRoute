# ChainRoute Protocol

A lightweight, decentralized provenance protocol using Polygon for immutable chaining and delegation, and Arweave for permanent data storage. It enables verifiable trails of events (e.g., ownership transfers, certifications) for physical or digital items, anchored by a single genesis root for easy traceability.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

ChainRoute addresses the need for tamper-proof provenance in a simple, cost-effective way. Traditional systems often rely on heavy smart contracts or custom blockchains, leading to high fees and complexity. ChainRoute separates data storage (permanent on Arweave) from signing and chaining (immutable on Polygon), allowing anyone to upload data while only authorized delegates canonize it via signed transactions. All elements reference a genesis Polygon hash, making verification straightforward without internal links in Arweave.

## Key Features

- **Single Genesis Root**: Every transaction and file embeds the same Polygon genesis hash for grouping and orphan-proofing.
- **Delegation Mechanism**: Seamless handovers (e.g., from creator to owner) via address-based delegation in Polygon tx data.
- **Lightweight Design**: No smart contracts; raw 127-byte Polygon data payloads; cheap, permanent Arweave storage.
- **Open Uploads**: Anyone can post to Arweave; Polygon signatures make it official.
- **Efficient Verification**: Start from any file/tx, extract genesis, scan Polygon for matches, fetch Arweave blobs.
- **Resilience**: Polygon as index; Arweave for data; compatible with hardware wallets (e.g., Ledger via BIP39).

## Architecture

ChainRoute forms a tree structure:

```
Genesis Polygon Tx (Root)
├── Provenance Event 1 (Polygon Tx)
│   └── Main Arweave Blob (Summary + Supports List)
│       ├── Supporting File 1 (e.g., Image)
│       └── Supporting File 2 (e.g., Cert)
├── Provenance Event 2 (Polygon Tx, delegated)
│   └── Main Arweave Blob ...
└── ... (Forward via delegates)
```

All nodes embed the genesis hash.

## How It Works

1. **Genesis Creation**: Sign a Polygon tx with zeros for hashes and self as delegate. This hash becomes the root.
2. **Event Posting**:
   - Upload supporting files to Arweave (embed genesis hash); get IDs.
   - Compile main JSON blob (summary fields + supports array + genesis hash); upload to Arweave; get ID.
   - Sign Polygon tx (by current delegate) with: genesis hash, previous Polygon hash, Arweave ID, next delegate.
3. **Delegation**: Update the delegate address in Polygon tx to transfer control.
4. **Verification**:
   - Extract genesis hash from any entry.
   - Scan delegate addresses' tx history on Polygon, filter by genesis prefix.
   - Traverse chain via previous/next links; fetch linked Arweave data.

For full details, see [protocol.md](./protocol.md).

## Why ChainRoute?

Compared to protocols like VeChain (enterprise-heavy with tokens) or OriginTrail (graph-focused with incentives), ChainRoute prioritizes minimalism: no tokens, no contracts, lower fees. It's ideal for art, collectibles, or supply chains needing simple, auditable histories. For complex compliance, alternatives like Provenance Blockchain may suit better.

## Getting Started

1. **Read the spec**: Check [protocol.md](./protocol.md) for byte-level details and JSON schemas. See [docs/examples](./docs/examples) for sample Arweave blobs and Polygon payloads, and [docs/diagrams](./docs/diagrams) for chain structure and data-flow diagrams.
2. **Implement a Poster** (Pseudocode Example):
   ```javascript
   // Using web3.js and Arweave SDK
   async function postEvent(signer, genesisHash, prevPolyHash, supports) {
     // Upload supports to Arweave, get IDs
     const supportIDs = await uploadSupports(supports, genesisHash);
     // Build main blob
     const mainBlob = { genesis: genesisHash, summary: "...", supports: supportIDs };
     const arweaveID = await uploadToArweave(mainBlob);
     // Sign Polygon tx
     const payload = Buffer.concat([genesisHash, prevPolyHash, Buffer.from(arweaveID, 'utf8'), nextDelegate]); // 127 bytes
     await signer.sendTransaction({ data: '0x' + payload.toString('hex') });
   }
   ```
3. **Verify a Chain**: Use Polygonscan API to query txs by address, filter by genesis, fetch Arweave via gateway (arweave.net/tx/ID).
4. **Tools**: Example scripts in [docs/code](./docs/code) (build payload, validate blob, post to Arweave/Polygon). Polygon signing supports **Ledger Stax** (or other Ledger devices) via `--key ledger`. Arweave uses JWK key files; Polygon can use a hex key file or Ledger. Reference libraries planned in `/reference-impl/`.

## Status

- Specification: v0.1 (Draft as of January 2026)
- Example code: [docs/code](./docs/code) (Node.js scripts for build/validate/post; Polygon supports Ledger Stax). Reference libraries (JS/Python) planned in `/reference-impl/`.
- Community: Open for feedback via issues/PRs.

## Contributing

See [CONTRIBUTE.md](./CONTRIBUTE.md) for guidelines. We welcome spec refinements, examples, and implementations.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 TechnoGoogie

Questions? Open an issue or reach out on X: [@TechnoGoogie](https://x.com/TechnoGoogie)
