# Development Phases

Suggested order to build and ship ChainRoute user-facing tools for maximum impact and reuse.

## Phase 1: Verify First (Highest Demand)

**Goal:** Anyone can verify a chain from a link or tx hash with zero install.

| Step | Deliverable | Dependencies |
|------|-------------|--------------|
| — | **Web Verifier prototype** (done): [UserApplicationTools/web-verifier](../web-verifier/) accepts Polygon anchor, event blob ID, support file ID, or genesis hash; backward walk (anchor) or forward walk; timeline + status. Run `npm install && npm start`. | Protocol; ethers; Polygonscan API for forward walk |
| 1.1 | **Verification API** (minimal): POST /verify with input (txHash, genesisHash, or Arweave ID); return chain + status. | Protocol; [docs/code/verify-chain.js](../../docs/code/verify-chain.js); align with web-verifier resolve + walk logic |
| 1.2 | **Web Verifier** (production): Harden prototype; optional QR scan; shareable URL; or call Verification API. | Web Verifier prototype or Verification API |
| 1.3 | **QR and share:** Scan QR or open link with ?tx=; shareable verifier URL. | Web Verifier |

**Outcome:** “Is this real?” answered in one place; shareable; foundation for mobile and extension.

---

## Phase 2: Build (Creators)

**Goal:** Creators can start a chain and add at least one event without reading the protocol.

| Step | Deliverable | Dependencies |
|------|-------------|--------------|
| 2.1 | **Web Builder (Provenance Studio) MVP:** Genesis (connect wallet or paste delegate); one event: upload supports → build blob → build payload → sign (wallet) → broadcast. | Protocol; [docs/code](https://github.com/ChainRoute/docs/code) logic |
| 2.2 | **Multi-event + delegate:** Add Event 2, 3, …; prev hash chaining; optional next-delegate. | 2.1 |
| 2.3 | **Ledger path:** “Sign on Ledger” flow: show payload/QR for signing elsewhere; paste signed tx; or WebUSB Ledger in browser. | 2.1 |

**Outcome:** First “no-code” path to a full chain; optional Ledger for security-conscious users.

---

## Phase 3: Embed and Extend

**Goal:** Verification and build can be embedded elsewhere; mobile and power users covered.

| Step | Deliverable | Dependencies |
|------|-------------|--------------|
| 3.1 | **Verification API v2:** Caching; optional manifest; support-tag check; rate limits and API keys. | Phase 1 |
| 3.2 | **Mobile Verify:** App or PWA: scan QR / open link → verify (call API) → show timeline; share. | Verification API; Web Verifier UX |
| 3.3 | **Browser extension:** Detect ChainRoute links; “Verify” badge; popup with status + link to Verifier. | Verification API |
| 3.4 | **Provenance API (orchestration):** Prepare payloads and blobs; client signs and returns; API broadcasts. Optional relay for Arweave. | Protocol; Web Builder needs |

**Outcome:** Marketplaces and apps can embed “Verified by ChainRoute”; mobile users can verify on the go; builders can use API for “prepare + sign elsewhere.”

---

## Phase 4: Desktop and Mobile Capture

**Goal:** Power users and field users have the right tools.

| Step | Deliverable | Dependencies |
|------|-------------|--------------|
| 4.1 | **Desktop app:** Genesis + events; Ledger native; Arweave key store; batch sign. | [docs/code](https://github.com/ChainRoute/docs/code); Phase 2 UX |
| 4.2 | **Mobile Capture:** Draft event with photos/files; upload to Arweave or “save for later”; export draft for Studio/API to finalize. | Arweave relay or SDK; Provenance API optional |

**Outcome:** Ledger-first workflow on desktop; evidence capture on phone with finalize elsewhere.

---

## Phase 5: AI and PaaS

**Goal:** Ease of use and enterprise options.

| Step | Deliverable | Dependencies |
|------|-------------|--------------|
| 5.1 | **Build assistant:** Natural-language event suggestion; form prefill; support file label suggestions. | Web/Desktop Builder; LLM + tools |
| 5.2 | **Verify / Explain agent:** “Explain this chain”; “Who signed event 3?”; anomaly hints. | Verification API; LLM + tools |
| 5.3 | **PaaS (optional):** Full “provenance as a service” with optional key custody for enterprises. | Provenance API; compliance and key lifecycle |

**Outcome:** Lower friction for creators; clearer explanations for verifiers; enterprise deployment path.

---

## Summary Table

| Phase | Focus | Key deliverables |
|-------|--------|------------------|
| 1 | Verify | Verification API, Web Verifier, QR/share |
| 2 | Build | Web Builder MVP, multi-event, Ledger path |
| 3 | Embed | API v2, Mobile Verify, Extension, Provenance API |
| 4 | Power users | Desktop app, Mobile Capture |
| 5 | AI + enterprise | Build + Verify agents, PaaS |

Adjust order based on resources: e.g. if “build” is more urgent, swap Phase 1 and 2; if mobile is priority, move 3.2 earlier.
