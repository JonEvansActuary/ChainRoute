# Concept: Web Verifier

**Platform:** Web (responsive; works on smartphone, tablet, desktop)  
**Primary job:** Let anyone verify ChainRoute provenance from a link, tx hash, or QR scan.  
**Demand:** Highest — “Is this real?” is the first question; zero install.

## User Stories

- As a **buyer**, I paste a Polygonscan or Arweave link (or tx hash) so I can see the chain and a clear “Verified” or “Invalid” result.
- As a **viewer**, I scan a QR code on a label and get the same verification on my phone.
- As a **curator**, I share a short link that opens the verifier with the chain preloaded so others can check.

## Core Flow

1. **Input:** User provides one of: Polygon tx hash (genesis or any event), Arweave blob URL/tx ID, or QR code (encoding one of the above).
2. **Resolve:** If Arweave ID → fetch blob, read `genesis`; if Polygon hash → decode 127-byte payload, get genesis/prev/blob/delegate. From genesis, optionally load a **chain manifest** (if known) for faster full-chain check.
3. **Traverse:** Walk backward (prev hash) to genesis; optionally forward (next delegate txs). For each Polygon tx, fetch corresponding Arweave blob; validate `genesis` match; optionally check support IDs and support-file tags (ChainRoute-Genesis).
4. **Present:** Timeline of events (Genesis → Event 1 → …), each with: event type, timestamp, summary, links to blob and supports. Green/red verification status; one-line summary (“Chain verified” / “Invalid: …”).
5. **Share:** Copy link “verifier.example/chain/<genesis-or-tx>” or “verifier.example/v/<shortId>”.

## Features (MVP → Later)

| Phase | Feature |
|-------|---------|
| MVP | Paste tx hash or Arweave URL; verify; show timeline + blob/support links; status. |
| + | QR scan (camera or upload); deep link from QR to verifier with prefilled ID. |
| + | Optional manifest upload or “known chain” list for faster + support-tag check. |
| + | Export report (PDF or shareable link). |
| + | “Explain in plain language” (AI) for the chain. |

## Tech Outline

- **Frontend:** SPA (e.g. React/Vue/Svelte); responsive; optional PWA for “Add to home screen.”
- **Backend (optional):** Can be 100% client-side: call Polygonscan (or public RPC) + Arweave gateway from browser. For rate limits or CORS, thin backend proxy or use Verification API.
- **QR:** Use device camera (getUserMedia) or file upload; decode URL or tx hash from QR payload; navigate to verifier with query param.
- **Reuse:** [docs/code/verify-chain.js](../docs/code/verify-chain.js), [verify-support-tags.js](../docs/code/verify-support-tags.js) logic; port to JS for browser or call Verification API.

## Success Metrics

- Time to “Verified” or “Invalid” &lt; 5 s for typical chain.
- Works on major mobile and desktop browsers without install.
- Shareable link works for 30 days (or permanent if backed by stable URL scheme).
