# Concept: Provenance API / PaaS (Build)

**Platform:** HTTP API + optional dashboard; cloud-hosted  
**Primary job:** Let enterprises or apps create chains and events without running their own signing infrastructure; optional key custody and “relay” posting.  
**Demand:** Medium — high for enterprises that want “provenance as a service.”

## Modes

### 6.1 Orchestration only (no custody)

- API accepts: support file uploads (or URLs), event metadata, delegate address.
- API returns: Arweave blob ID, 127-byte payload (hex), suggested nonce. Client (or user) signs Polygon tx and optionally posts to Arweave; client sends signed tx to API; API broadcasts to Polygon.
- Use case: Web Builder or mobile “finalize elsewhere”; API is the helper, not the signer.

### 6.2 Relay posting (Arweave only)

- User has Arweave key; API provides signed upload URLs or accepts encrypted payloads; API posts to Arweave on behalf of user (key never leaves user’s trust boundary in some flows, or user uploads key once in encrypted form).
- Use case: Mobile app without Arweave SDK; browser without key storage.

### 6.3 Full PaaS (optional custody)

- Enterprise stores delegate key with provider (encrypted, HSM or KMS); API creates genesis and events end-to-end: upload supports, post blob, build payload, sign, broadcast.
- Use case: High throughput; “we don’t want to manage Ledger”; audit logs and compliance.

## API Outline (Orchestration)

- **POST /chains:** Create genesis payload; return payload hex; client signs and returns signed tx; API broadcasts; return genesis hash.
- **POST /chains/:genesisHash/events:** Submit support file refs (or multipart upload), event JSON; API posts blob to Arweave, builds payload; returns payload hex; client signs and returns signed tx; API broadcasts; return event tx hash.
- **GET /chains/:genesisHash:** Return manifest (anchors, blobs, supports) for verification/display.

## Security and Trust

- Orchestration-only: minimal trust; client holds keys.
- Relay: trust in API for correct posting and no data retention of key material.
- Full PaaS: high trust; compliance and key lifecycle (rotation, revocation) must be defined.

## Success Metrics

- At least one Web or Mobile Builder uses API for “prepare + sign elsewhere” flow.
- If PaaS: enterprise can create 100+ events/day with stored delegate key and audit trail.
