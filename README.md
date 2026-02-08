# ChainRoute Protocol

A lightweight, decentralized provenance protocol using Polygon for immutable chaining and delegation, and Arweave for permanent data storage. It enables verifiable trails of events (e.g., ownership transfers, certifications) for physical or digital items, anchored by a single genesis root for easy traceability.

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

1. **Genesis Creation**: Sign a Polygon tx with 32-byte zero genesis hash, 32-byte zero previous hash, 43-byte zero Arweave ID, and self as delegate (20 bytes). This tx hash becomes the root.
2. **Event Posting**:
   - Upload supporting files to Arweave (embed genesis hash); get IDs.
   - Compile main JSON blob (summary fields + supports array + genesis hash); upload to Arweave; get ID.
   - Sign Polygon tx (by current delegate) with: genesis hash (32 bytes), previous Polygon hash (32 bytes), Arweave blob ID (43 bytes UTF-8), next delegate (20 bytes)—127 bytes total.
3. **Delegation**: Update the delegate address in Polygon tx to transfer control.
4. **Verification**:
   - Extract genesis hash from any entry.
   - Scan delegate addresses' tx history on Polygon, filter by genesis prefix.
   - Traverse chain via previous/next links; fetch linked Arweave data.

For full details, see [protocol.md](./protocol.md).

## Why ChainRoute?

Compared to protocols like VeChain (enterprise-heavy with tokens) or OriginTrail (graph-focused with incentives), ChainRoute prioritizes minimalism: no tokens, no contracts, lower fees. It's ideal for art, collectibles, or supply chains needing simple, auditable histories. For complex compliance, alternatives like Provenance Blockchain may suit better.

## Getting Started

1. **Read the spec**: Check [protocol.md](./protocol.md) for byte-level details and JSON schemas. For a general-audience overview (motivation, ideas, applications), open [docs/ChainRoute-Protocol-Slides.html](./docs/ChainRoute-Protocol-Slides.html) in a browser. See [docs/examples](./docs/examples) for sample Arweave blobs and Polygon payloads (including [HypotheticalPainting](./docs/examples/HypotheticalPainting) with 127-byte payload JSONs and an example **Polygon event signer file** listing who signed each tx). For confidentiality and security, signer/contact data may not be publicly posted to Arweave (or may be posted only in encrypted form) but may need to be provided to regulators, auditors, or other parties with a legitimate need to audit the provenance chain.
2. **Implement a Poster** (Pseudocode Example):
   ```javascript
   // Using web3.js and Arweave SDK. Payload: 32 + 32 + 43 + 20 = 127 bytes (see protocol.md §3.1).
   async function postEvent(signer, genesisHash, prevPolyHash, supports) {
     const supportIDs = await uploadSupports(supports, genesisHash);
     const mainBlob = { genesis: genesisHash, summary: "...", supports: supportIDs };
     const arweaveID = await uploadToArweave(mainBlob); // 43-char base64url string
     const payload = Buffer.concat([
       Buffer.from(genesisHash, 'hex'),      // 32 bytes
       Buffer.from(prevPolyHash, 'hex'),     // 32 bytes
       Buffer.from(arweaveID, 'utf8'),       // 43 bytes (genesis: 43 zero bytes)
       Buffer.from(nextDelegate.slice(2), 'hex')  // 20 bytes, no 0x
     ]);
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

See the [LICENSE](./LICENSE) file for copyright and terms.

Copyright (c) 2026 Jonathan Palmer Evans. All rights reserved.

Questions? Open an issue or reach out on X: [@TechnoGoogie](https://x.com/TechnoGoogie)
