# ChainForge AI – Build Plan & Cursor Instructions

**ETHDenver 2026 Buidlathon (Solo)**  
**Project**: ChainForge AI  
**Tagline**: *Forge unbreakable provenance chains in minutes. AI co-pilots the story; ChainRoute anchors it forever on Polygon + Arweave.*

---

## 0. Why This Can Win / Demo Narrative

- **Problem**: Provenance is fragmented, expensive, or centralized. Creators and buyers can’t easily prove or verify an item’s history.
- **Solution**: One flow to create, delegate, and verify chains—no smart contracts, no custom tokens. Data on Arweave (permanent); anchors on Polygon (cheap, fast). AI reduces friction for non-technical users.
- **Differentiators**: (1) Real protocol with exact 127-byte payload and Arweave blob spec. (2) Optional Ledger Stax signing for “cold” provenance. (3) Public verifier + QR for physical-world use. (4) AI that labels supports and suggests event copy.
- **2-minute demo script**: Connect wallet → Create genesis (one click or Ledger) → Upload 1–2 support files, show AI labels → Add one event with AI-suggested summary → Sign anchor → Open chain viewer → Paste tx on verifier page → Show QR. Keep Ledger as optional “wow” if time.

**Scope**: MVP = wizard (genesis + one event with supports + AI labels) + verifier + chain viewer. **Stretch (implemented):** Ledger path (WebHID in GenesisWizard), QR + NFT metadata export (chain page), full HypotheticalPainting demo preload (Load Example Chain on Verify).

---

## 1. Project Overview

Build a **no-code/low-code web dApp** so creators (artists, NFT makers, RWA owners) can create, delegate, and verify provenance chains using the **ChainRoute protocol v0.1** (see repo root `protocol.md`).

**User flow**

1. Connect Polygon wallet (or Ledger Stax).
2. Create genesis transaction (127-byte payload).
3. Upload support files → AI auto-labels/captions → post to Arweave with `ChainRoute-Genesis` tag.
4. AI helps build main provenance JSON blob.
5. Post blob to Arweave → get 43-char ID → sign & broadcast next 127-byte Polygon anchor tx.
6. View interactive chain timeline/tree.
7. Public verifier (paste genesis / tx / Arweave ID → full verification).
8. QR code for physical items + optional NFT metadata export.

**Protocol compliance**

- 127-byte payload: genesis 32B + prev 32B + Arweave ID 43B UTF-8 + delegate 20B (per `protocol.md`).
- Arweave blobs validated per `docs/code/validate-arweave-blob.js`.
- Verification mirrors `docs/code/verify-chain.js` and `docs/code/verify-support-tags.js`.

All paths above are relative to the **ChainRoute repo root**.

---

## 2. Tech Stack

| Layer | Choice |
|--------|--------|
| **Framework** | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| **UI** | shadcn/ui + Radix + Lucide icons + **reactflow** (chain tree) |
| **Wallet & signing** | wagmi + viem (preferred) or ethers v6 to align with `docs/code/` |
| **ChainRoute** | Copy/adapt from `docs/code/`: see Section 5 |
<<<<<<< HEAD
| **Arweave** | `arweave` npm (direct post; Bundlr not required) |
=======
| **Arweave** | `arweave` npm (direct post; Bundlr not used) |
>>>>>>> Update
| **AI** | Grok API or OpenAI (vision + text) for captions and event summary |
| **QR** | `qrcode.react` |
| **Deploy** | Vercel + **Polygon Amoy testnet** (Chain ID 80002; Mumbai is deprecated) |

**Install (from app root)**

```bash
npm install wagmi viem @tanstack/react-query lucide-react reactflow qrcode.react arweave
npm install -D @types/node
```
(Arweave is used directly via the `arweave` package; Bundlr is not required for this app.)

Add shadcn/ui per [shadcn docs](https://ui.shadcn.com/). Use **reactflow** (not `react-flow-renderer`) for the chain visualizer.

---

## 3. Project Structure

Suggested layout (app can live in `ETHDenver2026Buidlathon/chainforge-ai/` or repo root):

```
chainforge-ai/
├── app/
│   ├── page.tsx                    # Home / Wizard
│   ├── chain/[genesis]/page.tsx    # Public chain viewer
│   ├── continue/page.tsx           # Add events to existing chain (genesis/tx lookup)
│   ├── verify/page.tsx             # Public verifier
│   └── api/                        # AI + Arweave API routes
│       ├── ai/caption/, suggest-event/
│       └── arweave/post-blob/, post-support/
├── components/
│   ├── WalletConnect.tsx
│   ├── GenesisWizard.tsx
│   ├── SupportUploader.tsx         # Drag-drop + AI labeling
│   ├── EventBuilder.tsx            # AI-assisted blob form
│   ├── ChainVisualizer.tsx         # React Flow tree/timeline
│   ├── Verifier.tsx
│   └── QRCodeModal.tsx
├── lib/
│   ├── chainroute/                 # Adapted from docs/code (TypeScript)
│   │   ├── build-payload.ts
│   │   ├── build-blob.ts, validate-blob.ts
│   │   ├── polygon-anchor.ts
│   │   ├── verifier.ts
│   │   └── types.ts
│   └── ai.ts                       # Grok/OpenAI prompts
├── public/
│   └── demo/                       # Optional: HypotheticalPainting sample
└── README.md
```
(Arweave posting is implemented in app/api/arweave/* and lib/chainroute build-blob/validate-blob; no separate arweave-utils.ts. Types live in lib/chainroute/types.ts.)

---

## 4. Core Features & Pages

1. **Home / Wizard** (multi-step)  
   - Step 1: Wallet connect + Ledger option.  
   - Step 2: Genesis creation (`postPolygonAnchor` or Ledger).  
   - Step 3: Support upload (images/PDFs) → AI captioning.  
   - Step 4: Event builder (AI suggests `eventType` / summary).  
   - Step 5: Review + sign anchor tx.

2. **Chain viewer** (`/chain/[genesis]`)  
   - React Flow tree: nodes = events (Polygon tx + Arweave blob), edges = delegation.  
   - Clickable: Arweave blob preview, support thumbnails, Polygonscan links.

3. **Verifier** (`/verify`)  
   - Input: genesis hash, Polygon tx hash, or Arweave ID.  
   - Client-side verification (adapt `verify-chain.js` + support tags).  
   - Show timeline + validity status.

4. **Extras**  
   - QR code modal (link to verifier).  
   - Export NFT metadata JSON (include genesis URI).  
   - Demo button: load from `docs/examples/HypotheticalPainting` (or preloaded copy in `public/demo/`).

---

## 5. ChainRoute Integration (Critical)

- **Payload**: Reuse `buildPayload` / `decodePayload` from `docs/code/build-polygon-payload.js` (127 bytes exactly).  
- **Arweave**: Reuse logic from `post-support-to-arweave.js`, `post-provenance-blob-to-arweave.js`, `arweave-post.js`.  
- **Polygon anchor**: Reuse `post-polygon-anchor.js`; for Ledger use `docs/code/polygon-ledger-sign.js` (`signAndSendWithLedger`). Show address via `docs/code/show-ledger-address.js` (e.g. path `44'/60'/0'/0/0` or Ledger Live style `44'/60'/n'/0/0`).  
- **Verification**: Implement `verifyChain(genesisHash)` that:  
  - Resolves Polygon txs (viem `getTransaction` or indexer by delegate).  
  - Decodes payload with `decodePayload`.  
  - Fetches Arweave blobs; validates genesis match and supports.  
  - Checks `ChainRoute-Genesis` on support tx (Arweave GraphQL).  
- **Genesis tx**: 32 zero bytes (genesis + prev + Arweave ID) + delegate address.

Optional: align with `UserApplicationTools/web-verifier` (e.g. `verify-from-tx.js`, `forward-walk`) for consistent verification semantics.

---

## 6. AI Prompts (`lib/ai.ts`)

Use Grok or OpenAI chat completion:

```ts
// Prompt 1: Image / PDF analysis
"You are an expert art provenance assistant. Analyze this image/PDF and return JSON only: { caption: string, suggestedLabel: string, description: string }"

// Prompt 2: Event summary from supports + user text
"Given supports: { list } and user description: '{ text }', generate a ChainRoute-style event: return JSON with eventType, summary (object), and a short narrative (e.g. for 'narrative' field)."
```

Return structured JSON so the app can fill the blob and form without parsing prose.

---

## 7. Implementation Order (Cursor / Dev Sequence)

1. Scaffold Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui.  
2. Copy ChainRoute files from `docs/code/` into `lib/chainroute/` and convert to TypeScript.  
3. Wallet connect (wagmi) + Ledger option (read address via `show-ledger-address.js`; sign via `polygon-ledger-sign.js`).  
4. Genesis wizard step: `postPolygonAnchor` or Ledger path.  
5. Support uploader: drag-drop, AI labeling, post to Arweave with `ChainRoute-Genesis` tag.  
6. Event builder form + AI generation of event/summary.  
7. Chain visualizer with React Flow (nodes = Polygon tx + Arweave blob).  
8. Verifier page: full chain traversal and support-tag check.  
9. QR code modal + NFT metadata export.  
10. Polish: dark mode, responsive layout, loading states, error handling.

---

## 8. Testing & Demo

- **Network**: Polygon **Amoy** testnet (Chain ID 80002). RPC e.g. `https://rpc-amoy.polygon.technology`. Faucet: https://faucet.polygon.technology  
- **Demo data**: Preload or link to `docs/examples/HypotheticalPainting` for the “Load example” button.  
- **E2E**: Create genesis → upload supports → AI blob → anchor tx → open chain viewer → verify on `/verify`.  
- **Ledger**: Confirm path (e.g. `44'/60'/0'/0/0`) with `node docs/code/show-ledger-address.js --ledger-path "44'/60'/0'/0/0"`; enable blind signing / contract data in Ethereum app.

---

## 9. Polish & Deliverables

- Clear, modern UI (e.g. neon accents, chain-themed visuals).  
- Responsive and mobile-friendly.  
- Loading states for Arweave uploads and Polygon tx confirmation.  
- Deploy-ready `vercel.json`.  
- README: live demo link, local run, and “How we use ChainRoute” in one sentence.

**Deliverable**: A runnable Next.js app that demonstrates the full ChainRoute protocol with AI assistance, suitable for a strong Buidlathon demo and judging.

---

## How to Use This Plan in Cursor

1. Save this file in the repo (e.g. `ETHDenver2026Buidlathon/ProjectPlan.md`).  
2. In Cursor: “Create a new Next.js project called ChainForge AI exactly according to `ETHDenver2026Buidlathon/ProjectPlan.md`. Use TypeScript, Tailwind, and shadcn/ui. Import and reuse the ChainRoute modules from `docs/code/` where possible.”  
3. Build in the order of Section 7; keep protocol behavior identical to `docs/code/` and `protocol.md`.
