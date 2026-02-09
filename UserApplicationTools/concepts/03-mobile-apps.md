# Concept: Mobile Apps (Capture + Verify)

**Platform:** Native or cross-platform (e.g. React Native, Flutter, Swift/Kotlin)  
**Primary job:** **Capture** evidence on the go and attach to a chain; **Verify** at point of sale or when viewing an item (scan QR, see result).  
**Demand:** High for physical items — phone is the natural device for photos and instant verification.

## Two Modes

### 3.1 Mobile Verify

- **Input:** QR code on label, NFC tag (URL), or deep link (e.g. `chainroute://verify?tx=0x…` or `https://verifier.example/v/…`).
- **Flow:** App opens → camera or “paste link” → decode tx/URL → run verification (local or call Verification API) → show timeline, status, links to blobs/supports.
- **Extras:** Save “verified” history; share report; optional “Explain this chain” (AI).

### 3.2 Mobile Capture (Build)

- **Goal:** Capture photos/documents as support files and associate them with a chain/event without requiring full Polygon signing on device.
- **Flow:**  
  - User selects or creates a chain (genesis hash; may be “pending” until genesis is created elsewhere).  
  - User creates “Event draft”: takes photos, attaches files, adds event type and summary.  
  - App uploads supports to Arweave (with ChainRoute-Genesis tag) if user has Arweave key or uses relay; stores draft (blob JSON + support IDs).  
  - “Finalize” later: export draft (manifest + payload params) for Web/Desktop Builder or Provenance API to sign and post Polygon anchor.  
- **Alternative:** Mobile only uploads files; Web/Desktop Builder pulls “mobile uploads” from a cloud folder or relay and adds them to an event.

## User Stories

- As a **field auditor**, I scan a QR on the object and see the full chain and “Verified” before accepting it.
- As a **creator**, I take photos at an event, tag them to a chain and event draft, and finish the anchor on my laptop with Ledger.
- As a **buyer**, I scan the seller’s QR and get a shareable verification report.

## Features (MVP → Later)

| Phase | Feature |
|-------|---------|
| MVP (Verify) | Scan QR or open link → verify chain → show timeline + status; share link. |
| + | Save verification history; offline “last verified” cache. |
| MVP (Capture) | Select chain (paste genesis); create draft event; add photos/files; upload to Arweave (or “save for later”); export draft JSON for Studio/API. |
| + | In-app Arweave upload with stored key (secure enclave); delegate “sign anchor” to Web/Desktop. |
| + | AI: “Suggest event type from these photos” or “Summarize this event in one sentence.” |

## Tech Outline

- **Verify:** Same verification logic as Web Verifier (or call Verification API); camera for QR (native or lib); deep links for `chainroute://` or HTTPS.
- **Capture:** Camera + file picker; optional Arweave SDK (key in secure storage); optional backend “draft store” and “relay upload” so mobile doesn’t need Arweave key.
- **Keys:** Prefer not storing Polygon signing key on phone; use relay or “finalize on desktop.” Arweave key optional (upload from device) or use relay.

## Success Metrics

- Verify: &lt; 10 s from scan to “Verified”/“Invalid” on 4G.
- Capture: User can add supports and export a draft that Web Builder or API can consume without re-uploading files.
