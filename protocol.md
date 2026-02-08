# ChainRoute Protocol Specification

**Version: 0.1 (Draft)**  
**Date: January 27, 2026**  
**Author: Jonathan Palmer Evans**  
See [LICENSE](./LICENSE) for copyright and terms.

This document specifies the ChainRoute Provenance Protocol in detail. It defines data formats, workflows, and rules for implementation. The protocol is designed to be lightweight, extensible, and verifiable without requiring smart contracts or custom tokens.

## 1. Motivation

Provenance tracking for items (e.g., art, collectibles, supply chain goods) often suffers from centralization, high costs, or complexity. ChainRoute leverages Polygon's low-fee immutability for chaining and delegation, and Arweave's permanent storage for data, creating a decentralized, tamper-proof trail. Key innovation: Separate open data uploads from authorized signing, with a universal genesis anchor for traceability.

## 2. Design Goals

- **Simplicity**: Minimal data (127 bytes per Polygon tx); no smart contracts.
- **Resilience**: Single genesis root prevents forking/orphans; Polygon indexes, Arweave stores.
- **Flexibility**: Delegation for handovers; anyone can upload to Arweave, delegates canonize.
- **Efficiency**: Cheap fees; fast verification via Polygon scans.
- **Security**: Relies on chain immutability and hardware wallet support.
- **Extensibility**: Open for additions like multi-sig or event types without breaking core.

## 3. Core Formats

### 3.1 Polygon Transaction Payload
Each provenance event is anchored via a simple Polygon transaction (EVM-compatible). The `data` field is a **fixed 127-byte** sequence (big-endian, no separators). No ABI encoding required—parse as concatenated bytes. The layout is always the same so every payload is exactly 127 bytes.

| Offset | Field                  | Size (Bytes) | Description |
|--------|------------------------|--------------|-------------|
| 0-31   | Genesis Hash          | 32           | SHA-256 hash of the genesis Polygon tx (or 32 zeros for genesis itself). Groups all under one chain. |
| 32-63  | Previous Polygon Hash | 32           | Hash of the prior Polygon tx in the chain (32 zeros for the first event after genesis). Enables backward traversal. |
| 64-106 | Arweave ID            | 43           | **Always 43 bytes.** Full Arweave transaction ID of the main provenance blob (43 bytes UTF-8 of the 43-character base64url string). When there is no blob (e.g. genesis), use 43 zero bytes (0x00)—padded to 43 so the payload stays 127 bytes. Enables direct query/recovery on Arweave. |
| 107-126| Delegate Address      | 20           | Ethereum-style address (0x-prefixed, but stored as raw bytes) of the next authorized signer. Enables forward delegation. |

- **Genesis Tx Example** (Hex): `000...0 (32 zeros) | 000...0 | 000...0 (43 zeros) | [20-byte self-address]`
- **Subsequent Tx Example**: Use tools like Web3.js to pack: `Buffer.concat([genesisHash, prevHash, Buffer.from(arweaveTxIdString, 'utf8'), delegateAddr])`. The Arweave ID must be exactly 43 characters (base64url); encode as UTF-8 for the 43-byte field.
- **Signing**: Tx signed by current delegate using ECDSA (Polygon standard). No `to` address needed—send to null or self for data-only tx.

### 3.2 Arweave Main Provenance Blob
The main event data is a JSON object uploaded to Arweave as a single transaction. It must start with the genesis hash for reverse lookup. No internal chaining—Polygon handles sequencing.

Recommended JSON Schema (validate with tools like AJV):

```json
{
  "type": "object",
  "properties": {
    "genesis": {
      "type": "string",
      "description": "Hex string of the Polygon genesis tx hash (64 chars).",
      "pattern": "^[0-9a-fA-F]{64}$"
    },
    "eventType": {
      "type": "string",
      "description": "e.g., 'creation', 'transfer', 'certification'."
    },
    "timestamp": {
      "type": "string",
      "description": "ISO 8601 format (e.g., '2026-01-27T18:37:00Z')."
    },
    "summary": {
      "type": "object",
      "description": "Free-form key-value pairs for event details (e.g., { 'from': 'Alice', 'to': 'Bob', 'description': 'Ownership transfer' })."
    },
    "supports": {
      "type": "array",
      "description": "List of supporting Arweave tx IDs with optional labels.",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]{43}$" },
          "label": { "type": "string" }
        },
        "required": ["id"]
      }
    }
  },
  "required": ["genesis", "eventType", "timestamp", "summary"]
}
```

- **Example Blob**:
  ```json
  {
    "genesis": "0000000000000000000000000000000000000000000000000000000000000000",
    "eventType": "transfer",
    "timestamp": "2026-01-27T18:37:00Z",
    "summary": {
      "from": "0xAliceAddress",
      "to": "0xBobAddress",
      "item": "Painting #42",
      "description": "Sold at auction"
    },
    "supports": [
      { "id": "Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3Aa4B", "label": "photo" },
      { "id": "Xy9Zz8Yw7Vu6Ts5Rq4Po3On2Nm1Lk0Ji9Hg8Gf7Fe6E", "label": "invoice" }
    ]
  }
  ```

### 3.3 Arweave Supporting Files
- Raw blobs (e.g., JPEG, PDF).
- Embed genesis hash: For text/binary files, prefix with 32-byte hash (or in metadata like EXIF for images).
- No other requirements—keeps them simple and standalone.

### 3.4 Polygon event signer documentation (optional)
Implementations may maintain a **signer/event-operator file** (e.g. one row per Polygon tx) listing, for each event: event name, signer name, role, Polygon address, and optionally contact or other operational details. This links on-chain delegate addresses to real-world identities for auditing and accountability. **Confidentiality and safety**: For individual confidentiality, safety, and security, this file and its contents may *not* be publicly posted to Arweave or elsewhere, or may be posted only in encrypted form. The information may, however, need to be provided to responsible interested parties—such as regulators, law enforcement, insurers, or other parties with a legitimate need to audit the chain of provenance—under appropriate legal or contractual arrangements.

## 4. Workflows

### 4.1 Posting an Event
1. Upload supporting files to Arweave (include genesis hash); collect IDs.
2. Build and upload main JSON blob to Arweave; get tx ID.
3. Sign Polygon tx with payload as specified; include Arweave ID.
4. Broadcast to Polygon network.

### 4.2 Delegation
- In Polygon tx, set delegate to new address.
- New delegate must sign future txs referencing the same genesis/previous.

### 4.3 Verification
1. Extract genesis hash from any Polygon tx or Arweave file.
2. Query Polygon (e.g., via API/scan): Start from known delegate, fetch all txs, filter those with matching genesis prefix.
3. Traverse: Backward via previous hash; forward by scanning next delegate's txs for matches.
4. For each valid Polygon tx, fetch Arweave blob via ID; validate genesis match; fetch supports.
5. Check timestamps/signers for consistency.

## 5. Security Considerations
- **Key Management**: Use hardware wallets (Ledger supports both chains via BIP39).
- **Compromise**: If delegate key stolen, chain can be spoofed post-theft—mitigate with multi-sig extensions or revocations (future).
- **Replay Attacks**: Polygon nonces prevent; Arweave IDs are unique.
- **Availability**: Relies on Polygon/Arweave uptime—use gateways/mirrors.
- **Auditing**: Off-chain indexes verifiable against on-chain data.

## 6. Extensibility
- Add optional fields to JSON (e.g., "signatures" for multi-sig).
- Support other EVM chains (e.g., Ethereum) or storage (e.g., IPFS) via forks.
- Event types: Define standards in extensions (e.g., for NFTs: add ERC-721 token ID).

Feedback welcome—open issues for clarifications or proposals.
