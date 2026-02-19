# ChainRoute-Forge -- 2-Minute Demo Script (ETHDenver 2026 Buidlathon)

## One-line scope (for submission & pitch)

**MVP:** Create genesis (wallet or Ledger cold sign), one event with supports and AI, anchor on Polygon, verify any tx, QR code, NFT metadata export, and preloaded example chain.
**Protocol:** ChainRoute v0.1 -- 127-byte payloads, Arweave blobs with ChainRoute-Genesis tags, Polygon Amoy anchors, client-side verification.

---

## Pre-demo checklist (5--10 min before)

1. **Browser:** Use **Chrome or Edge** (Ledger WebHID and app work best). Avoid Safari for Ledger.
2. **Smoke test:** Open the live app -> go to **Verify** -> click **Load Example Chain** once. If it loads, RPC and Arweave are reachable; the result is cached for instant repeat demos.
3. **Wallet:** Ensure your wallet is on **Polygon Amoy** (Chain ID **80002**). Switch network in MetaMask/wallet if needed.
4. **MATIC on Amoy:** You need a little MATIC to sign genesis and anchor txs. Faucet: **https://faucet.polygon.technology** (select Polygon Amoy).
5. **Ledger (if using):** Connect the device once and enable **Blind signing** (or Contract data) in the Ethereum app so you're not fumbling during the demo.

---

## 2-minute script (90 seconds)

1. **Table opener (optional):** Hand judge a physical QR card.
   *"Scan this---it's a real provenance chain."* (Link goes to Verify with example or your chain.)

2. **Connect wallet** (Polygon Amoy) or **Ledger.**
   *"ChainRoute-Forge uses Polygon for cheap anchors and Arweave for permanent data---no smart contracts. You can also sign genesis cold with Ledger."*

3. **Create genesis** (one click, or Ledger mode).
   Toggle **Ledger** -> **Use Ledger** (connect device, enable Blind signing in Ethereum app) -> **Create genesis (cold sign on Ledger).**
   *"This is the root of the provenance chain. Cold-signed root when using Ledger."*

4. **Upload 1--2 support files.**
   If API keys are set: click **AI label**.
   *"Supports are posted to Arweave with the ChainRoute-Genesis tag."*
   If no keys: *"AI labels are optional; Arweave upload needs server keys---without them we can still create genesis and use Verify."*

5. **Build event** (event type + summary).
   If API keys are set: click **Suggest with AI**.

6. **Post blob & sign anchor.**
   *"Blob goes to Arweave; the anchor tx on Polygon links it to the chain."*

7. **View chain.**
   Click **View chain**.
   *"Export NFT Metadata"* -> downloads ERC-721-style JSON (genesis, events, Arweave IDs, verify URL).
   *"Take this metadata for your collection."*

8. **Verify.**
   Go to **Verify**. Click **Load Example Chain** for the HypotheticalPainting chain (Polygon mainnet), or paste any tx hash.
   *"Protocol-verified in seconds. QR code for physical items."*

9. **QR code** (from success step).
   *"Scan to open the verifier link."*

*(90 seconds; Loom backup ready.)*

---

## If something fails live

- **No Arweave key:** *"Upload and blob post need server keys. You can still create genesis and use Verify with existing chains."*
- **No AI key:** *"AI is optional; labels and event can be filled manually."*
- **Ledger:** *"Use Chrome or Edge with WebHID; enable Blind signing or Contract data in the Ethereum app."*
- **Wrong network / no MATIC:** *"Switch to Polygon Amoy (Chain ID 80002) and get test MATIC from faucet.polygon.technology."*
- **Timeout or RPC slow:** *"Let me show the example chain---no wallet needed."* -> Verify -> **Load Example Chain**; show QR and NFT export.
- **Chain view only shows genesis:** *"Paste the latest tx hash on Verify to see the full chain and blob."*

---

## Rehearse

- Run through once with env set (full flow).
- Run once with **Load Example Chain** on Verify (no wallet needed).
- Run once without Arweave key (genesis + verify only).
- Keep under 2 minutes; cut to Verify + QR + Load Example if short on time.
