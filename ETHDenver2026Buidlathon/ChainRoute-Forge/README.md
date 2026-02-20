# ChainRoute-Forge

**Forge unbreakable provenance chains in minutes.** AI co-pilots the story; ChainRoute anchors it forever on Polygon + Arweave.

ETHDenver 2026 Buidlathon project. No-code/low-code dApp to create, delegate, and verify provenance chains using the [ChainRoute protocol](https://github.com/ChainRoute) (127-byte payload, Arweave blobs).

**Scope:** Create genesis (wallet or **Ledger cold sign**), one event with supports and AI, anchor on Polygon, verify any tx, QR code, **one-click NFT metadata export**, and **Load Example Chain** (HypotheticalPainting) on Verify. See [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) for the 2-minute demo script and [ONE-PAGER.md](./ONE-PAGER.md) for submission.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind
- wagmi + viem (Polygon Amoy)
- React Flow (chain visualizer), qrcode.react
- Arweave (server-side post via API routes)
- OpenAI or Grok API for AI captions and event suggestions

## Run locally

From the repo root:

```bash
cd ETHDenver2026Buidlathon/ChainRoute-Forge
npm install
npm run dev
```

(If you're already in `ETHDenver2026Buidlathon`, use `cd ChainRoute-Forge`.)

Open [http://localhost:3000](http://localhost:3000).

## Env (optional)

Copy `.env.example` to `.env` and fill in as needed (all keys optional for basic run).

- **RPC (recommended for demos):** `NEXT_PUBLIC_AMOY_RPC` and optionally `NEXT_PUBLIC_POLYGON_MAINNET_RPC` – provider URLs (e.g. Alchemy, Infura) for Polygon Amoy and mainnet. Improves reliability and reduces rate limits vs public RPCs.
- **Polygonscan API (optional):** `NEXT_PUBLIC_POLYGONSCAN_AMOY_API_KEY` and/or `NEXT_PUBLIC_POLYGONSCAN_MAINNET_API_KEY` – for higher rate limits when loading "My Chains" from Polygonscan (get keys at [polygonscan.com/apis](https://polygonscan.com/apis)).
- **Arweave read (optional):** `NEXT_PUBLIC_ARWEAVE_GATEWAY` and/or `NEXT_PUBLIC_ARWEAVE_GRAPHQL` – gateway URL for fetching blobs and GraphQL URL for tag lookups. Use an alternate gateway if you need better reliability than the default arweave.net.
- `GROK_API_KEY` – for AI caption and event suggestions
- **Arweave post (optional):** `ARWEAVE_KEY_PATH` (path to JWK file) or `ARWEAVE_JWK` (inline JWK JSON string). Use `ARWEAVE_JWK` on Vercel since the server has no file system for key files. Either enables posting support files and event blobs to Arweave.

Without Arweave keys, support upload and blob post show a clear message; you can still connect wallet, create genesis, and use Verify with existing chains.

## Flow

1. Connect Polygon (Amoy) wallet or **Ledger** (WebHID; enable Blind signing in Ethereum app)
2. Create genesis (127-byte payload) — toggle **Ledger** to cold-sign on device
3. Upload support files → optional AI labels → post to Arweave with `ChainRoute-Genesis` tag
4. Build event (eventType + summary) with optional AI suggestion
5. Post blob to Arweave → sign & send anchor tx on Polygon
6. View chain at `/chain/[genesis]` → **Export NFT metadata** (ERC-721–style JSON)
7. **Verify** at `/verify` — paste tx hash or click **Load Example Chain** (HypotheticalPainting, Polygon mainnet); QR code for physical items
8. **Continue**: Use `/continue` to add events to an existing chain (paste genesis or tx hash)
9. **My Chains**: Click your wallet address in the header to see chains you've created or verified — with quick links to verify or continue each one

## Architecture notes

- **Anchor target**: Anchor transactions are sent to a dedicated burn address (`0x...dEaD`) rather than self-transactions, avoiding MetaMask's "internal accounts cannot include data" restriction. The verifier only reads the `data` payload and does not check the `to` field.
- **My Chains storage**: Chain history is tracked in localStorage (saved on genesis creation, event anchoring, and successful verification). No external indexer or API key required.
- **Dark/light theme**: Toggled via class-based Tailwind dark mode with localStorage persistence.
- **Network selector**: Switch between Polygon Amoy (testnet) and Polygon mainnet from the header.

## Deploy on Vercel

Vercel-ready. The app lives in a subdirectory of the repo, so when importing the project on Vercel:

1. **Set Root Directory** to `ETHDenver2026Buidlathon/ChainRoute-Forge` in **Project Settings → General → Root Directory**.
2. **Add environment variables** in the Vercel dashboard (Settings → Environment Variables). See `.env.example` for the full list. Key notes:
   - `NEXT_PUBLIC_*` vars are embedded at build time — redeploy after changing them.
   - Use `ARWEAVE_JWK` (minified single-line JWK JSON) instead of `ARWEAVE_KEY_PATH` — Vercel serverless functions have no file-system access.
   - `NEXT_PUBLIC_POLYGONSCAN_*_API_KEY` values should be the **API key string only**, not a full URL.
3. **Build & deploy** — Vercel auto-detects Next.js via `vercel.json` and runs `npm install` + `npm run build`.

Run `npm run build` locally first to verify the production build. Use Polygon Amoy (Chain ID 80002) for testnet. Before the event, smoke-test the live URL (e.g. open Verify → **Load Example Chain**). Share the live URL in your Buidlathon submission.
