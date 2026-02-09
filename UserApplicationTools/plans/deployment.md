# Deployment and Operations

How to host, run, and operate the [concepts](../concepts/) in production.

## Verification API

| Aspect | Recommendation |
|--------|----------------|
| **Hosting** | Serverless (AWS Lambda, Cloudflare Workers) or container (ECS, Fly.io); scale on demand |
| **Domain** | e.g. `api.chainroute.example` or `verify.chainroute.example` |
| **RPC** | Dedicated Polygon RPC key (Alchemy, Infura) for stability and rate limits |
| **Arweave** | Use 1–2 gateways with fallback; consider arweave.dev + arweave.net |
| **Cache** | Redis (ElastiCache, Upstash) or in-memory with TTL; cache by genesis or last tx |
| **Secrets** | API keys (for consumers) in env or secret manager; no private keys |
| **Monitoring** | Latency, error rate, cache hit rate; alert on RPC or Arweave failures |

## Web Verifier

| Aspect | Recommendation |
|--------|----------------|
| **Hosting** | Static site (Vercel, Netlify, Cloudflare Pages) or same origin as API |
| **Domain** | e.g. `verify.chainroute.example` or `chainroute.example/verify` |
| **Config** | Env: API base URL; optional analytics |
| **Short links** | Optional: separate service or DB for `/v/:id` → tx hash; or encode in path |

## Web Builder (Provenance Studio)

| Aspect | Recommendation |
|--------|----------------|
| **Hosting** | Same as Verifier or separate app on same domain (e.g. `studio.chainroute.example`) |
| **CORS** | If API on different origin, allow Studio origin; restrict to known domains |
| **No server key storage** | All signing in browser or “sign elsewhere”; optional relay for Arweave only (see Provenance API) |

## Provenance API (Orchestration / PaaS)

| Aspect | Recommendation |
|--------|----------------|
| **Hosting** | Same as Verification API or dedicated service; stateless for orchestration |
| **File relay** | If accepting uploads: object store (S3, R2) with short-lived signed URLs; delete after post to Arweave |
| **Key custody (PaaS)** | HSM or KMS; encrypt delegate key per tenant; audit log every sign/broadcast |
| **Compliance** | Document key lifecycle, access control, and data retention |

## Mobile Apps

| Aspect | Recommendation |
|--------|----------------|
| **Distribution** | App Store / Play Store; optional TestFlight / internal track |
| **Config** | API base URL and (if needed) deep-link scheme in build config |
| **Updates** | Standard app release cycle; optional in-app “what’s new” |

## Desktop App

| Aspect | Recommendation |
|--------|----------------|
| **Distribution** | Signed installers (macOS notarization, Windows code signing); website or store |
| **Updates** | Auto-update (e.g. Tauri updater, Electron update) with signed bundles |

## Browser Extension

| Aspect | Recommendation |
|--------|----------------|
| **Stores** | Chrome Web Store, Firefox Add-ons; optional Safari |
| **Config** | Verification API URL in extension config or manifest |

## AI Agents

| Aspect | Recommendation |
|--------|----------------|
| **Hosting** | Backend that calls LLM + Verification API (and future Build API); or serverless per request |
| **Keys** | LLM API key in secret manager; no user keys |
| **Cost** | Rate limit and token limits per user or per app |

## General

- **Protocol and docs:** Keep [protocol.md](../../protocol.md) and [docs/code](../../docs/code) as source of truth; version API if payload or verification rules change.
- **Observability:** Logs, metrics, and (where applicable) audit logs for sign/broadcast and key access.
- **Security:** HTTPS only; no private keys in frontend or logs; minimal scope for API keys.
