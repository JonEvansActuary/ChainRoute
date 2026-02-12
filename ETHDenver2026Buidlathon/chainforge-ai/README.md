# ChainForge AI

**Forge unbreakable provenance chains in minutes.** AI co-pilots the story; ChainRoute anchors it forever on Polygon + Arweave.

ETHDenver 2026 Buidlathon project. No-code/low-code dApp to create, delegate, and verify provenance chains using the [ChainRoute protocol](https://github.com/ChainRoute) (127-byte payload, Arweave blobs).

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind
- wagmi + viem (Polygon Amoy)
- React Flow (chain visualizer), qrcode.react
- Arweave (server-side post via API routes)
- OpenAI or Grok API for AI captions and event suggestions

## Run locally

```bash
cd ETHDenver2026Buidlathon/chainforge-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env (optional)

- `OPENAI_API_KEY` or `GROK_API_KEY` – for AI caption and event suggestions
- `ARWEAVE_KEY_PATH` or `ARWEAVE_JWK` – for posting supports and blobs to Arweave (server)

Without Arweave keys, support upload and blob post will return 503; you can still connect wallet and create genesis.

## Flow

1. Connect Polygon (Amoy) wallet
2. Create genesis transaction (127-byte payload)
3. Upload support files → optional AI labels → post to Arweave with `ChainRoute-Genesis` tag
4. Build event (eventType + summary) with optional AI suggestion
5. Post blob to Arweave → sign & send anchor tx on Polygon
6. View chain at `/chain/[genesis]`, verify at `/verify`, QR code for verifier link

## Deploy

Vercel-ready. Set env vars in the dashboard. Use Polygon Amoy (Chain ID 80002) for testnet.
