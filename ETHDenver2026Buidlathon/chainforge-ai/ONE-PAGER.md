# ChainForge AI — One-Pager (ETHDenver 2026 Buidlathon)

**Tagline:** *Forge unbreakable provenance chains in minutes. AI co-pilots the story; ChainRoute anchors it forever on Polygon + Arweave.*

---

## Problem

Creators and custodians need **tamper-evident, verifiable provenance** for physical and digital assets—without smart contracts, without lock-in. Existing solutions are either centralized, complex, or not permanently anchored.

## Solution

**ChainForge AI** is a web app that builds **ChainRoute protocol** provenance chains:

- **Genesis** → root anchor on Polygon (Amoy); optional **Ledger cold signing**.
- **Events** → type + summary + support files; supports and blobs on **Arweave** with ChainRoute-Genesis tags.
- **Verification** → paste any tx hash or **load the example chain**; client-side verification of payload, blob, and tags; **QR code** for physical items.
- **NFT metadata export** → one-click download of ERC-721–style JSON (genesis, events, Arweave IDs) for creator economies and RWAs.

**Protocol:** 127-byte payloads, no smart contracts, permanent Arweave blobs, Polygon anchors. Full spec in ChainRoute `protocol.md` and `docs/code/`.

## Live link

**[Deploy URL]** — e.g. `https://chainforge-ai.vercel.app`

## Screenshot

*(Insert: Connect → Genesis (with Ledger toggle) → Verify with “Load Example Chain” and QR.)*

## Bounties targeted

- **ETHERSPACE** — creator economies, RWAs, provenance.
- **Polygon** — Amoy anchors, Ledger/Wallet UX.
- **Arweave** — permanent blobs and support files.
- **Base** — NFT metadata export for collections.

## Tech

Next.js, wagmi, viem, Arweave, ChainRoute lib (build-payload, polygon-anchor, verifier, Ledger WebHID).

---

*ChainForge AI — Immutable decisions, verifiable paths, permanent impact.*

**Before submission:** Replace `[Deploy URL]` above with your live Vercel (or other) URL and add a screenshot in the Screenshot section.
