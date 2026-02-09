# Tech Stack Suggestions

Recommendations for implementing the [concepts](../concepts/) and [development phases](./development-phases.md). Prefer reuse of [docs/code](../../docs/code) and protocol consistency.

## Shared / Protocol Layer

| Concern | Suggestion | Notes |
|---------|------------|------|
| **127-byte payload** | Reuse or port [build-polygon-payload.js](../../docs/code/build-polygon-payload.js) (build + decode) | TypeScript/JS module for web and Node |
| **Blob schema** | [validate-arweave-blob.js](../../docs/code/validate-arweave-blob.js); JSON Schema (e.g. AJV) in all builders | |
| **Verification logic** | Port [verify-chain.js](../../docs/code/verify-chain.js), [verify-support-tags.js](../../docs/code/verify-support-tags.js) to TS/JS; call from API, Web Verifier, or extension | Single source of truth |
| **Polygon RPC** | Public RPC or dedicated (e.g. Alchemy, Infura); same for all clients | |
| **Arweave** | arweave-js or gateway REST; post + GraphQL for tags | |

## Web Verifier

| Layer | Suggestion |
|-------|------------|
| Frontend | React, Vue, or Svelte; responsive; optional PWA (workbox) |
| Verification | Call Verification API (preferred) or embed ported verify-chain logic in worker/bundle |
| QR | `jsQR` or native `BarcodeDetector`; camera via getUserMedia |
| Hosting | Static (Vercel, Netlify, Cloudflare Pages) if API elsewhere; or same origin as API |

## Web Builder (Provenance Studio)

| Layer | Suggestion |
|-------|------------|
| Frontend | React/Next or Vue/Nuxt; wizard steps; form state (e.g. Zustand, Pinia) |
| Wallet | ethers.js + WalletConnect or MetaMask inject; optional WebUSB/WebHID for Ledger |
| Arweave | Post from browser via gateway (CORS) or backend relay; JWK in memory only |
| Polygon | ethers.js; sign and send or “export payload → paste signed” |

## Verification API

| Layer | Suggestion |
|-------|------------|
| Runtime | Node (Express, Fastify) or serverless (Lambda, Cloudflare Workers) |
| Logic | Same as verify-chain + verify-support-tags; Polygon public RPC; Arweave gateway + GraphQL |
| Cache | Redis or in-memory; key = genesis or last tx; TTL e.g. 5–15 min |
| Auth | API key for rate limit / tiers; no auth for read-only verify |

## Provenance API (Orchestration / PaaS)

| Layer | Suggestion |
|-------|------------|
| Runtime | Node or serverless; stateless for orchestration |
| Storage | Optional DB for “pending” events, manifests; object store for file relay |
| Keys | Never store in plaintext; if custody: HSM/KMS + encrypted at rest |

## Desktop App

| Layer | Suggestion |
|-------|------------|
| Shell | Tauri (Rust + web view) or Electron |
| Ledger | ledger-transport-node-hid (Node) or Rust equivalent in Tauri |
| Keys | OS keychain (macOS Keychain, Windows DPAPI, libsecret) or encrypted file |
| Arweave / Polygon | Same as docs/code; Node or Rust SDK |

## Mobile (Verify + Capture)

| Layer | Suggestion |
|-------|------------|
| Framework | React Native, Flutter, or native (Swift/Kotlin) |
| QR | Native camera + QR lib or ML Kit |
| Verify | HTTP to Verification API |
| Capture | Camera + file picker; Arweave SDK if key on device, else relay upload |
| Deep links | `chainroute://verify?tx=...` or `https://verifier.example/v/...` |

## Browser Extension

| Layer | Suggestion |
|-------|------------|
| Manifest | V3 (Chrome, Firefox); Safari adapter if needed |
| Content | Minimal DOM; detect links and tx hash patterns; inject “Verify” or context menu |
| Background | Service worker; call Verification API |
| Popup | Small UI; link to full Verifier |

## AI Assistants

| Layer | Suggestion |
|-------|------------|
| LLM | Any provider with tool/function calling (OpenAI, Anthropic, open models) |
| Build tools | `create_event_draft({ eventType, summary, supportLabels })`; structured output |
| Verify tools | `verify_chain(txHash)`, `get_chain_summary(genesisHash)`; use Verification API |
| UX | In-app chat panel or standalone bot; CLI for power users |

## Summary

- **Reuse:** Protocol and [docs/code](../../docs/code) everywhere; one verification implementation (API or shared lib).
- **Web-first:** Verifier and Builder as SPAs; API for verification and optional orchestration.
- **Keys:** Browser = wallet + optional Ledger; Desktop = Ledger + local key store; Mobile = optional key or relay.
- **AI:** Tool-calling agents that consume APIs and suggest drafts; no signing by agent.
