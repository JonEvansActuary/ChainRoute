# ChainRoute User Application Tools

Concepts, outlines, and plans for smartphone, desktop, web, and cloud applications that help users **build** ChainRoute provenance records or **query and verify** their authenticity. This folder prioritizes high-demand use cases and leverages AI/agents to reduce friction.

## Two Core User Jobs

| Job | Who | Need |
|-----|-----|------|
| **Build** | Creators, galleries, insurers, supply-chain operators | Create chains (genesis), add events (support files → Arweave blob → Polygon anchor), delegate signers. Minimal steps, correct payloads, safe keys (Ledger). |
| **Verify** | Buyers, auditors, insurers, marketplaces, consumers | Answer “Is this real?” from a link, QR code, or tx hash. See chain timeline, event details, support links; get a clear valid/invalid + explanation. |

## Ecosystem Overview

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   USER APPLICATION TOOLS                 │
                    └─────────────────────────────────────────────────────────┘
 Build provenance                    │                    Query & verify
 ─────────────────                    │                    ─────────────────
 • Web: Provenance Studio (wizard)     │                    • Web: Verifier (paste/scan)
 • Desktop: Studio + Ledger/batch     │                    • Mobile: Scan QR → verify
 • Mobile: Capture evidence on the go │                    • Browser extension: Verify badge
 • Cloud: Provenance API / PaaS       │                    • Cloud: Verification API
 • AI: Event assistant, form filler   │                    • AI: “Explain this chain” agent
```

## Anticipated Demand (Priority Order)

1. **Web Verifier** — Zero install; shareable links; “Is this real?” is the top question. High impact, low friction.
2. **Web Builder (Provenance Studio)** — Single place for creators to start; works everywhere; optional “sign on Ledger elsewhere” flow.
3. **Verification API** — Lets marketplaces, insurers, and apps embed “Verified by ChainRoute” without reimplementing.
4. **Mobile: Capture + Verify** — Capture evidence on phone; verify at point of sale or when viewing an item.
5. **AI build assistant** — Natural-language event creation; fewer form errors; suggested support file roles.
6. **Desktop app** — Power users; better Ledger/USB and key handling; batch uploads.
7. **AI verify assistant** — “Explain this chain,” “Who signed event 3?”, anomaly hints.
8. **Browser extension** — Verify on any page that shows a ChainRoute link or tx hash.
9. **Provenance API / PaaS** — For enterprises that want managed posting and optional key custody.

## Folder Structure

| Path | Contents |
|------|----------|
| [README.md](./README.md) | This overview and index. |
| [concepts/](./concepts/) | Concept docs and outlines per app/service. |
| [plans/](./plans/) | Development phases, tech stack, deployment. |

## AI and Agents

- **Build:** Conversational “add an event” (e.g. “Transfer from Alice to Bob on date X”) → suggested eventType, summary, support slots. Folder scanner suggesting which files are supports for which event. Form prefill from past events.
- **Verify:** “Explain this chain” in plain language; “Who signed event 3?”; “Is this chain complete?”; anomaly detection (e.g. timestamp gaps, delegate changes) with short explanations.
- **Integration:** Agents can call Verification API and (future) Build API; chat UIs in web/desktop apps or standalone (e.g. CLI, Slack-style).

## Protocol Reference

All tools consume or produce data per the [ChainRoute Protocol](../protocol.md): 127-byte Polygon payloads, Arweave main blobs (JSON), support files (ChainRoute-Genesis tag), and optional chain manifests for verification. Existing scripts live in [docs/code](../docs/code/).
