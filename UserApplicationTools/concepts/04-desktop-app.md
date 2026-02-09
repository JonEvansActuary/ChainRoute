# Concept: Desktop App (Provenance Studio Native)

**Platform:** Desktop (Windows, macOS, Linux) — e.g. Electron, Tauri, or native  
**Primary job:** Full build workflow with best-in-class Ledger support, local key storage, and batch operations.  
**Demand:** Medium–high for power users, enterprises, and anyone who prefers Ledger/USB and local control.

## Why Desktop

- **Ledger:** Direct USB/WebHID; no browser permission quirks; same UX as Ledger Live.
- **Keys:** Arweave JWK and (optionally) Polygon key in local encrypted store; user controls backup.
- **Batch:** Bulk upload support files; build multiple events in sequence; repeatable flows.
- **Offline:** Prepare payloads and blobs; sign when Ledger connected; broadcast when online.

## User Stories

- As a **registrar**, I connect my Ledger once per session and sign a dozen events in a row without re-prompting for each.
- As a **creator**, I keep my Arweave key only on this machine and use the app to post supports and blobs, then sign anchors with Ledger.
- As a **team**, I run the app on a designated “signing machine” and receive event payloads from a web form or API for signing only.

## Core Flow

- Same as Web Builder (genesis → events: supports → blob → payload → sign → broadcast), with:
  - **Ledger:** Native dialog; path selection (e.g. Ledger Live 44'/60'/n'/0/0); sign and broadcast in one step.
  - **Key store:** Encrypted file or OS keychain for Arweave JWK; optional Polygon hot key for testing.
  - **Batch:** Queue: “Event 1 payload ready,” “Event 2 payload ready,” …; sign all with Ledger in sequence; broadcast (with nonce handling).
  - **Import/Export:** Load chain manifest; export signed tx hashes; sync with Verification API or manifest file.

## Features (MVP → Later)

| Phase | Feature |
|-------|---------|
| MVP | Genesis + one event; Ledger sign + broadcast; Arweave upload (local JWK). |
| + | Multi-event; batch sign; key store (encrypted). |
| + | “Sign only” mode: receive payload (paste or file), sign with Ledger, output signed tx for someone else to broadcast. |
| + | Integration with Provenance API (fetch pending events, push signed txs). |
| + | AI: Same as Web (suggest event type/summary from description). |

## Tech Outline

- **Stack:** Tauri (Rust + web view) or Electron; reuse Web Builder UI as web view or share components.
- **Ledger:** Use existing [docs/code/polygon-ledger-sign.js](../../docs/code/polygon-ledger-sign.js) logic; port to Rust (ledger-transport) or Node in Electron.
- **Arweave:** Node or Rust SDK; read JWK from key store; post to gateway.
- **Polygon:** ethers.js or equivalent; same payload build as docs/code.

## Success Metrics

- Ledger user completes genesis + 3 events without touching browser.
- Batch: 10 events prepared; user signs 10 times on Ledger; all broadcast with correct nonces.
- No keys leave the machine unless user exports backup.
