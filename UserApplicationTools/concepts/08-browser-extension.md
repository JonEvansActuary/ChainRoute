# Concept: Browser Extension (Verify Badge)

**Platform:** Browser extension (Chrome, Firefox, Safari/WebKit)  
**Primary job:** On any page that shows a ChainRoute link or Polygon tx hash, offer a one-click “Verify” that runs verification and shows a compact result.  
**Demand:** Medium — convenient for power users and marketplaces that embed links.

## User Stories

- As a **buyer** on a marketplace, I see a “Verify ChainRoute” badge next to an item; I click it and get a popup with Verified/Invalid and a link to full verifier.
- As a **researcher**, I’m on a page full of tx hashes; I select one and choose “Verify with ChainRoute” from context menu to get a quick result.

## Core Flow

1. **Detect:** Content script scans page for:  
   - Links to Polygonscan (e.g. `polygonscan.com/tx/0x…`), Arweave (e.g. `arweave.net/…`, `viewblock.io/arweave/…`), or verifier URLs.  
   - Plain text matching tx hash (0x + 64 hex) or Arweave tx ID (43-char base64url).
2. **Badge / action:** Overlay a small “Verify” icon or add a context menu “Verify ChainRoute provenance.”
3. **On click:** Extension sends tx/URL to background script; background calls Verification API (or runs same logic in service worker); returns status + short summary.
4. **Popup:** Show “Verified” (green) or “Invalid” (red) + “View full report” link to Web Verifier with prefilled ID.

## Features (MVP → Later)

| Phase | Feature |
|-------|---------|
| MVP | Detect Polygonscan and Arweave links; “Verify” button; call API; show status in popup; link to verifier. |
| + | Detect raw tx hash in selection; context menu “Verify.” |
| + | Optional: cache result for session to avoid repeated calls. |

## Tech Outline

- Manifest V3 (Chrome); content script with minimal DOM changes (inject buttons or use context menu).
- Background/service worker: HTTP to Verification API; or embed lightweight JS verification (Polygon RPC + Arweave fetch) if no API dependency.
- Popup UI: minimal HTML or React; link to `https://verifier.example/...?tx=...`.

## Success Metrics

- One click from a Polygonscan or Arweave link to Verified/Invalid.
- Works on major marketplaces or docs that embed such links.
