# ChainForge AI – 2-Minute Demo Script (ETHDenver 2026 Buidlathon)

## One-line scope (for submission & pitch)

**MVP:** Create genesis, one event with supports and AI, anchor on Polygon, verify any tx and show QR.  
**Stretch:** Ledger signing and NFT metadata export (not in this build).

---

## 2-minute script

1. **Connect wallet** (Polygon Amoy).  
   *“ChainForge uses Polygon for cheap anchors and Arweave for permanent data—no smart contracts.”*

2. **Create genesis** (one click).  
   *“This is the root of the provenance chain. Optionally set who can sign the next anchor.”*

3. **Upload 1–2 support files.**  
   If API keys are set: click **AI label** to show auto-caption.  
   *“Supports are posted to Arweave with the ChainRoute-Genesis tag.”*  
   If no keys: *“AI labels are optional; you can add labels manually. Arweave upload needs server keys—without them we can still create genesis and verify existing chains.”*

4. **Build event** (event type + summary).  
   If API keys are set: click **Suggest with AI**.  
   *“AI suggests event type and summary from your supports.”*

5. **Post blob & sign anchor.**  
   *“Blob goes to Arweave; the anchor tx on Polygon links it to the chain.”*

6. **View chain.**  
   Click **View chain** (link includes the event you just created, so you see genesis + event).  
   *“Full chain is visible here when we have the event tx; otherwise use Verify to paste any tx hash.”*

7. **Verify.**  
   Go to **Verify**, paste the same (or any) tx hash.  
   *“Verifier checks payload, blob, and support tags. QR code for physical items.”*

8. **QR code** (from success step).  
   *“Scan to open the verifier link—useful for physical art or items.”*

---

## If something fails live

- **No Arweave key:** *“Upload and blob post need server keys. You can still create genesis and use Verify with existing chains.”*
- **No AI key:** *“AI is optional; labels and event can be filled manually.”*
- **Chain view only shows genesis:** *“Paste the latest tx hash on Verify to see the full chain and blob.”*

---

## Rehearse

- Run through once with env set (full flow).
- Run once without Arweave key (genesis + verify only).
- Keep under 2 minutes; cut to Verify + QR if short on time.
