# ChainForge AI

**Forge unbreakable provenance chains in minutes.** AI co-pilots the story; ChainRoute anchors it forever on Polygon + Arweave.

ETHDenver 2026 Buidlathon project. No-code/low-code dApp to create, delegate, and verify provenance chains using the [ChainRoute protocol](https://github.com/ChainRoute) (127-byte payload, Arweave blobs).

**Scope:** MVP = create genesis, one event with supports and AI, anchor on Polygon, verify any tx and show QR. Stretch = Ledger signing and NFT metadata export (not in this build). See [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) for the 2-minute demo script and pitch one-liner.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind
- wagmi + viem (Polygon Amoy)
- React Flow (chain visualizer), qrcode.react
- Arweave (server-side post via API routes)
- OpenAI or Grok API for AI captions and event suggestions

## Run locally

From the repo root:

```bash
cd ETHDenver2026Buidlathon/chainforge-ai
npm install
npm run dev
```

(If you're already in `ETHDenver2026Buidlathon`, use `cd chainforge-ai`.)

Open [http://localhost:3000](http://localhost:3000).

## Env (optional)

Copy `.env.example` to `.env` and fill in as needed (all keys optional for basic run).

- `OPENAI_API_KEY` or `GROK_API_KEY` – for AI caption and event suggestions
- `ARWEAVE_KEY_PATH` or `ARWEAVE_JWK` – for posting supports and blobs to Arweave (server)

Without Arweave keys, support upload and blob post show a clear message; you can still connect wallet, create genesis, and use Verify with existing chains.

## Flow

1. Connect Polygon (Amoy) wallet
2. Create genesis transaction (127-byte payload)
3. Upload support files → optional AI labels → post to Arweave with `ChainRoute-Genesis` tag
4. Build event (eventType + summary) with optional AI suggestion
5. Post blob to Arweave → sign & send anchor tx on Polygon
6. View chain at `/chain/[genesis]`, verify at `/verify`, QR code for verifier link  
   - **Continue**: Use `/continue` to add events to an existing chain (paste genesis or tx hash).

## Deploy

Vercel-ready. Run `npm run build` to verify production build. Set env vars in the Vercel dashboard. Use Polygon Amoy (Chain ID 80002) for testnet. Share the live URL in your Buidlathon submission.
