# Concept: Verification API (Cloud Service)

**Platform:** HTTP API (REST or GraphQL); hostable on any cloud  
**Primary job:** Let any app, marketplace, or insurer verify a ChainRoute chain by tx hash or genesis; return structured result.  
**Demand:** High — embeds “Verified by ChainRoute” without each client reimplementing verification.

## Consumers

- **Web Verifier / Mobile Verify:** Call API instead of implementing Polygon + Arweave logic in client.
- **Marketplaces:** “Verify provenance” button → API → show badge and timeline.
- **Insurers / auditors:** Batch verify many chains; integrate into existing dashboards.
- **AI agents:** “Explain this chain” agent calls API for chain + events, then summarizes.

## API Outline

### POST (or GET) /verify

- **Input:** `txHash` (Polygon, genesis or any event) or `genesisHash` or `arweaveBlobId`. Optional: `manifestUrl` or `manifest` JSON for support-tag and full-chain check.
- **Output:**  
  - `status`: `"verified"` | `"invalid"` | `"partial"`  
  - `genesisHash`, `chainLength`, `events`: array of `{ step, txHash, prevHash, arweaveBlobId, delegate, blobSummary?, supportTagOk? }`  
  - `errors`: optional list (e.g. "Support tag mismatch for tx …")  
  - `timeline`: same events with human-readable labels for display

### GET /chain/:genesisHash

- Return full chain summary + events (if indexed); or trigger on-the-fly traversal and cache.

### Optional: webhooks

- Notify when a new event is anchored for a given genesis (for dashboards).

## Implementation Notes

- Backend runs logic equivalent to [verify-chain.js](../docs/code/verify-chain.js) and [verify-support-tags.js](../docs/code/verify-support-tags.js): fetch Polygon txs (public RPC), decode 127-byte payloads, fetch Arweave blobs and support tags (GraphQL or gateway).
- Rate limiting and API keys for heavy consumers.
- Optional caching: chain result keyed by genesis (or last tx) with TTL.
- No PII; only public chain data.

## Success Metrics

- Sub-second response for cached chain; &lt; 5 s for cold traversal.
- Used by at least Web Verifier and one third-party (e.g. marketplace or AI).
