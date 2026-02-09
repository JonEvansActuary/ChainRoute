# Concept: Web Builder (Provenance Studio)

**Platform:** Web (desktop-first; usable on tablet)  
**Primary job:** Guide creators through building a ChainRoute chain: genesis, then events (supports → blob → Polygon anchor).  
**Demand:** High — single place to start; no install; optional Ledger via “sign on another device.”

## User Stories

- As a **creator**, I follow a wizard: create genesis → add Event 1 (upload supports, describe event, post blob, sign anchor) → add Event 2, …
- As a **delegate**, I sign only the Polygon tx (e.g. on Ledger on my laptop) while the Studio runs in the browser on another device.
- As a **team**, I upload support files and fill event details; a designated signer completes the Polygon step.

## Core Flow

1. **Genesis:** User enters delegate address (or “me” → connect wallet / Ledger). App builds 127-byte genesis payload (zeros + delegate); user signs (in-app wallet or “Export payload → sign elsewhere”); app broadcasts; displays genesis hash for the chain.
2. **Per event:**  
   - Upload support files → app posts to Arweave with ChainRoute-Genesis tag (or “prepare upload” for user to post elsewhere and paste IDs).  
   - Fill event form: eventType, timestamp, summary; attach support IDs.  
   - App builds main blob JSON, posts to Arweave, gets blob ID.  
   - App builds event payload (genesis, prev hash, blob ID, next delegate); user signs Polygon tx; app broadcasts.  
   - Repeat for next event (prev hash = this tx hash).
3. **Delegate handover:** When building payload, user sets “next delegate” to new address; that address signs subsequent events.
4. **Export:** Download chain manifest (genesis + list of tx hashes, blob IDs, support files) for verification and records.

## Features (MVP → Later)

| Phase | Feature |
|-------|---------|
| MVP | Genesis creation (payload build, sign via connected wallet or paste signed tx); one event: upload supports (Arweave), build blob, build payload, sign, broadcast. |
| + | Multi-event wizard; persist “current chain” in session/localStorage; delegate handover. |
| + | “Sign on Ledger” flow: show payload hex or QR for signing on desktop Ledger app; paste signed tx back. |
| + | Arweave key: generate or upload JWK (encrypted in memory only); or “post via our relay” (trusted upload). |
| + | AI: “Describe this event in words” → suggest eventType and summary fields. |
| + | Templates: “Authentication event,” “Transfer,” etc. with pre-filled eventType and suggested support labels. |

## Tech Outline

- **Frontend:** Wizard-style SPA; file upload (multipart or chunked) for supports; form validation against protocol (64-hex genesis, 43-char Arweave IDs, etc.).
- **Keys:** In-browser: MetaMask / WalletConnect for Polygon; Arweave JWK in memory or session (no server storage). Ledger: WebUSB/WebHID for connect-in-browser, or “offline sign” flow (show payload → sign elsewhere → paste).
- **Arweave:** Post from browser via gateway (e.g. arweave.net) or via backend relay (user auth, relay posts with user’s key or delegated key).
- **Polygon:** Public RPC or relay; sign with injected wallet or Ledger; broadcast.
- **Reuse:** [docs/code](https://github.com/ChainRoute/docs/code) scripts logic (build payload, build blob, validate); port to TS/JS for browser.

## Success Metrics

- Creator completes genesis + one event without reading protocol spec.
- Optional Ledger path works without requiring desktop app.
- No long-term custody of user’s private keys on server.
