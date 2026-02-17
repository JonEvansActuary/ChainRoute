# ChainRoute-Forge – Must-Do List (ETHDenver 2026 Buidlathon)

**All times MST.**  
**Event:** Feb 18–21 · National Western Center · ETHERSPACE track + sponsor bounties.

---

## About tables / booths

You **do not** reserve or pay for a demo table separately. Submitting your project on **Devfolio** (ETHERSPACE + bounties) is your Buidlathon registration. Accepted projects usually get an **assigned table** at the Community Judging Fair (check the event site or app for “Locate table” / your row & table number). If you’re unsure, confirm with ETHDenver (website or Discord). Either way, have your **demo kit** ready: laptop with live app, QR cards, and demo script—for your table, a judging walk-through, or an ad‑hoc pitch.

---

## Camp BUIDL schedule (do not conflict)

**Feb 15–17:** Camp BUIDL at **CSU Spur Hydro Building**, **9:00 AM – 5:00 PM** each day.  
All must-do tasks below are scheduled **before 9 AM** or **after 5 PM** on those days so you can attend every session.

---

## Feb 15 (Sun) – After Camp BUIDL

*Camp BUIDL: 9 AM – 5 PM. Do the following in the evening.*

| Time     | Item | Status |
|----------|------|--------|
| 6:00 PM  | Confirm Ledger flow works in browser (Chrome/Edge, Blind signing on). | ☐ |
| 7:00 PM  | Test full flow: connect → genesis (wallet + Ledger) → supports → event → anchor → View chain → Export NFT metadata → Verify → Load Example Chain. | ☐ |
| 8:00 PM  | Print 5× QR cards (link to deployed Verify page or example chain). Use hotel printer or cardstock. | ☐ |
| 9:00 PM  | Fill in ONE-PAGER: replace `[Deploy URL]` with live Vercel URL; note where to add screenshot. | ☐ |

---

## Feb 16 (Mon) – Before & after Camp BUIDL

*Camp BUIDL: 9 AM – 5 PM. Optional: use lunch break for quick deploy check.*

| Time     | Item | Status |
|----------|------|--------|
| 7:00 AM  | Record 90-second Loom: Connect → genesis (Ledger option) → AI supports + event → anchor → View chain → NFT export → Verify → QR. Use DEMO-SCRIPT.md. | ☐ |
| 7:45 AM  | Export one-pager to PDF (from ONE-PAGER.md). | ☐ |
| 5:30 PM  | `npm run build`; fix any errors. Deploy to Vercel (or redeploy). | ☐ |
| 6:00 PM  | Smoke-test live URL: Load Example Chain, verify, QR. | ☐ |
| 6:30 PM  | Rehearse 2-minute demo once with full env (Arweave + AI keys). | ☐ |
| 7:00 PM  | Rehearse once without Arweave key (genesis + Verify + Load Example only). | ☐ |

---

## Feb 17 (Tue) – Before & after Camp BUIDL

*Camp BUIDL: 9 AM – 5 PM.*

| Time     | Item | Status |
|----------|------|--------|
| 7:30 AM  | Submit on Devfolio: ETHERSPACE primary + bounties (Polygon, Arweave, Base). Attach Loom + one-pager PDF. | ☐ |
| 5:30 PM  | Pack demo kit: laptop, 5× QR cards, printed protocol diagram (optional). | ☐ |
| 6:30 PM  | Final rehearsal; keep under 2 minutes. | ☐ |

---

## Feb 18–21 (Wed–Sat) – Buidlathon event days

*At National Western Center (no Camp BUIDL; main event). If you get an assigned table, use it; otherwise you’re ready for any judging or pitch slot.*

| When       | Item | Status |
|------------|------|--------|
| Each day   | Demo kit ready: laptop (live app open), QR cards, demo script. | ☐ |
| Judging    | Opener: hand judge a QR card → “Scan this—it’s a real provenance chain.” Then run 90-second script. | ☐ |
| If issues  | Fallback: “Load Example Chain” on Verify (no wallet needed); show NFT export and QR. | ☐ |

---

## Quick reference

- **Camp BUIDL:** Feb 15–17, 9 AM–5 PM, CSU Spur Hydro Building (attend all sessions).
- **Demo script:** `ChainRoute-Forge/DEMO-SCRIPT.md`
- **One-pager:** `ChainRoute-Forge/ONE-PAGER.md`
- **Live app:** [Your Vercel URL]
- **Bounties:** ETHERSPACE, Polygon (Amoy), Arweave, Base

---

## Detailed step-by-step instructions

Use these for each item in the tables above. Check off the item only after completing all steps for it.

---

### Feb 15 · 6:00 PM — Confirm Ledger flow works in browser

1. Connect your Ledger Stax (or compatible device) via USB.
2. Open the Ethereum app on the device; enable **Blind signing** (Settings → Blind signing → Enabled).
3. Open Chrome or Edge and go to your app (local `http://localhost:3000` or live Vercel URL).
4. Connect wallet area: find and click the option to **Use Ledger** (or toggle Ledger mode).
5. Allow the browser’s WebHID prompt to connect to the Ledger.
6. Confirm the app shows your Ledger-derived address (e.g. truncated with `0x…`).
7. In the genesis step, click **Create genesis (cold sign on Ledger)**.
8. On the Ledger device: review and approve the transaction when prompted.
9. Confirm the app shows success (genesis tx hash / link). If any step fails, note the error and fix (e.g. Blind signing, WebHID permissions, cable).

---

### Feb 15 · 7:00 PM — Test full flow (connect → genesis → supports → event → anchor → View chain → Export NFT → Verify → Load Example)

1. **Connect:** Open the app; connect with **browser wallet** (MetaMask or similar on Polygon Amoy). Confirm address and balance.
2. **Genesis (wallet):** Create genesis with the wallet (no Ledger). Copy or note the genesis tx hash.
3. **Genesis (Ledger):** Disconnect wallet if needed; switch to Ledger; create a second genesis with Ledger cold sign. Note that tx hash (or skip if you only have one device).
4. **Supports:** Upload 1–2 support files (image or PDF). If AI keys are set, click **AI label** and confirm captions appear. Post to Arweave (or see graceful message if no key).
5. **Event:** In the event step, fill event type and summary; if AI is available, click **Suggest with AI**. Build the event blob.
6. **Anchor:** Post blob to Arweave (if keys set), then sign and send the anchor tx on Polygon. Wait for confirmation; note the event tx hash.
7. **View chain:** Click **View chain** (from success step or nav). Confirm the chain page shows genesis and the new event; check that **Export NFT metadata** downloads a JSON file.
8. **Verify:** Open the Verify page. Paste the genesis hash or the event tx hash. Run verification; confirm “Valid” and timeline.
9. **Load Example Chain:** On Verify, click **Load Example Chain** (HypotheticalPainting). Confirm the example loads and verifies; show QR if applicable.
10. If anything fails, fix errors (env, RPC, keys) and re-run the failing step until the full flow passes.

---

### Feb 15 · 8:00 PM — Print 5× QR cards

1. Open your deployed Verify page in the browser (e.g. `https://your-app.vercel.app/verify`).
2. Optional: add a query so the QR encodes a specific chain, e.g. `?input=<txHash>` or use **Load Example Chain** and then capture the URL shown.
3. Use a QR generator (in-app QR modal, or a site like qr-code-generator.com) to create a QR that points to that Verify URL.
4. Save the QR as an image (PNG/SVG) or screenshot the app’s QR modal.
5. In a doc or design tool, create a simple card layout: QR code + one line of text (e.g. “Scan — real provenance chain (ChainRoute-Forge)”).
6. Print 5 copies (hotel printer, or cardstock at a print shop). Cut to card size if needed.
7. Keep the 5 cards with your demo kit.

---

### Feb 15 · 9:00 PM — Fill in ONE-PAGER (Deploy URL + screenshot note)

1. Open `ChainRoute-Forge/ONE-PAGER.md` in an editor.
2. Find the line with **`[Deploy URL]`** (in the “Live link” section).
3. Replace `[Deploy URL]` with your actual live URL (e.g. `https://chainroute-forge.vercel.app`). Keep the rest of the sentence if there’s an example.
4. In the **Screenshot** section, add a short note for yourself: e.g. “Insert: Connect → Genesis (with Ledger toggle) → Verify with Load Example Chain and QR” so you know what to capture before exporting to PDF.
5. Save the file. You will export this to PDF on Feb 16 morning.

---

### Feb 16 · 7:00 AM — Record 90-second Loom

1. Open `ChainRoute-Forge/DEMO-SCRIPT.md` and read the 2-minute script (sections 1–8).
2. Prepare the app: live Vercel URL open, wallet or Ledger ready, no extra tabs needed for the flow.
3. Start Loom (or similar) and choose “Screen + camera” or “Screen only”; set for ~90 seconds max.
4. Run the script in order: (1) optional QR card opener, (2) Connect wallet or Ledger, (3) Create genesis (show Ledger if using), (4) Upload 1–2 supports + AI label if available, (5) Build event + AI suggest if available, (6) Post blob & sign anchor, (7) View chain + Export NFT metadata, (8) Verify + Load Example Chain + QR. Speak the talking points from DEMO-SCRIPT.md; keep under 90 seconds.
5. Stop recording; preview; trim if needed. Save and download the Loom link (e.g. `https://www.loom.com/share/...`) for Devfolio submission.

---

### Feb 16 · 7:45 AM — Export one-pager to PDF

1. Open `ChainRoute-Forge/ONE-PAGER.md` (with `[Deploy URL]` already replaced).
2. Optional: add a screenshot to the Screenshot section (paste image under the “Insert: …” line if your editor supports it).
3. Export to PDF: use VS Code “Markdown PDF” extension, or paste the rendered markdown into Google Docs / Word and export as PDF, or use a site like md2pdf.
4. Save the file as e.g. `ChainRoute-Forge-One-Pager.pdf` in a folder you can find for Devfolio.
5. Open the PDF and confirm the live link and formatting look correct.

---

### Feb 16 · 5:30 PM — npm run build and deploy to Vercel

1. In a terminal, go to the app: `cd ETHDenver2026Buidlathon/ChainRoute-Forge` (or `cd ChainRoute-Forge` if already in Buidlathon).
2. Run `npm run build`. Wait for completion.
3. If the build fails: read the error (e.g. TypeScript, missing env, lint). Fix the cause (code or config), then run `npm run build` again until it succeeds.
4. If using Vercel CLI: run `vercel --prod` (or `vercel` then promote), or push to the connected Git branch and let Vercel auto-deploy.
5. In the Vercel dashboard, confirm the latest deployment is live and the project env vars (e.g. `OPENAI_API_KEY`, `GROK_API_KEY`, `ARWEAVE_KEY_PATH` or `ARWEAVE_JWK`) are set if you use them.
6. Copy the production URL (e.g. `https://your-project.vercel.app`) and update ONE-PAGER.md or your notes if the URL changed.

---

### Feb 16 · 6:00 PM — Smoke-test live URL

1. Open your live Vercel URL in an incognito or fresh browser window.
2. **Load Example Chain:** Go to the Verify page; click **Load Example Chain**. Confirm the HypotheticalPainting chain loads and shows valid verification.
3. **Verify:** Paste a tx hash (from your own chain or the example) and confirm the result and timeline.
4. **QR:** Open the QR modal (if on a chain/verify view) and confirm the QR displays and the encoded URL is correct when scanned (or use a QR reader app to check).
5. If anything fails (wrong network, 404, broken Verify), fix the deploy or config and re-test until all three work.

---

### Feb 16 · 6:30 PM — Rehearse 2-minute demo with full env (Arweave + AI keys)

1. Ensure your machine and Vercel env have Arweave and AI keys set so support upload and AI suggestions work.
2. Open the live app and `ChainRoute-Forge/DEMO-SCRIPT.md` side by side.
3. Run the full demo once: Connect → genesis (Ledger if desired) → upload supports with AI label → build event with AI suggest → post blob & anchor → View chain → Export NFT metadata → Verify → Load Example Chain → show QR.
4. Time yourself; stay under 2 minutes. If over, trim talking points or skip one optional step (e.g. second support file).
5. Note any stumbles or slow parts; practice those once more so the 2-minute run is smooth.

---

### Feb 16 · 7:00 PM — Rehearse without Arweave key (genesis + Verify + Load Example only)

1. In Vercel (or local .env), remove or comment out `ARWEAVE_KEY_PATH` / `ARWEAVE_JWK` so the app runs without Arweave (or use a separate preview deployment without those vars).
2. Open the app and run the fallback flow: Connect wallet → Create genesis (no support upload, or ignore the “no key” message) → go to Verify → **Load Example Chain** and verify; show QR.
3. Practice saying one line for judges: e.g. “If Arweave or AI keys aren’t set, you can still create genesis and verify any chain—here’s the example chain and QR.”
4. Time this shorter run (under 1 minute). Confirm you can demo confidently with no Arweave/AI so you’re ready for key or network issues.

---

### Feb 17 · 7:30 AM — Submit on Devfolio (ETHERSPACE + bounties, Loom + one-pager PDF)

1. Go to the ETHDenver 2026 Devfolio (or official submission URL from the event).
2. Find the project submission form for ETHERSPACE (and any bounty tracks).
3. Fill in project name (e.g. ChainRoute-Forge), tagline, description (you can use the one-pager text or README summary).
4. Set **ETHERSPACE** as the primary track; add bounties: **Polygon** (Amoy), **Arweave**, **Base** as applicable.
5. In “Video” or “Demo link”, paste your Loom URL (the 90-second recording from Feb 16).
6. In “Document” or “PDF”, attach your one-pager PDF (ChainRoute-Forge-One-Pager.pdf).
7. Add the live app URL in the designated field.
8. Review all fields; submit. Save the confirmation or submission link.

---

### Feb 17 · 5:30 PM — Pack demo kit

1. **Laptop:** Charge fully; close unneeded apps; set Do Not Disturb or similar so notifications don’t pop during demos. Bookmark the live app URL and DEMO-SCRIPT.md (local or cloud).
2. **QR cards:** Put the 5 printed QR cards in a pocket or folder so you can hand one to a judge.
3. **Printed protocol diagram (optional):** If you have a one-page diagram of ChainRoute (genesis → events → Arweave + Polygon), print it and add it to the kit.
4. Do a quick check: open the live app on the laptop and load the Verify page; confirm one QR card scans to the right URL.

---

### Feb 17 · 6:30 PM — Final rehearsal (under 2 minutes)

1. Open the live app and DEMO-SCRIPT.md. Set a 2-minute timer.
2. Run the full demo once: QR card opener (if using) → Connect → genesis (Ledger option) → supports + event → anchor → View chain → Export NFT metadata → Verify → Load Example Chain → QR.
3. Stop when the timer goes off. If you’re over 2 minutes, cut one optional part (e.g. second support or long narrative) and run again until you’re under.
4. Repeat once more so the final run feels smooth. You’re done when you can hit all key points in under 2 minutes.

---

### Feb 18–21 · Each day — Demo kit ready

1. Before leaving for the venue (or at the start of the day), charge the laptop and open the live app (Verify or Home) in a tab.
2. Ensure the 5 QR cards are on you (or in your bag).
3. Have DEMO-SCRIPT.md open or on your phone so you can glance at talking points.
4. Quick check: load the app and click “Load Example Chain” on Verify to confirm the app and network work.

---

### Feb 18–21 · Judging — Opener + 90-second script

1. When a judge approaches (or you’re in a pitch slot), hand them one QR card and say: “Scan this—it’s a real provenance chain.”
2. While they scan (or if they prefer to watch), open the live app and run the 90-second script from DEMO-SCRIPT.md: Connect → genesis (Ledger if you’re using it) → supports + event → anchor → View chain → NFT export → Verify → Load Example Chain → QR.
3. Keep to 90 seconds so they can ask questions. Emphasize: no smart contracts, permanent Arweave + Polygon anchors, AI for creators, QR for physical world.

---

### Feb 18–21 · If issues — Fallback demo

1. If the live app fails (network, RPC, or keys): don’t panic. Say something like: “Let me show you the verifier with the example chain—no wallet needed.”
2. Open the Verify page; click **Load Example Chain**. Show the HypotheticalPainting chain verifying.
3. If the chain page works, open a chain (from a bookmark or pasted URL) and show **Export NFT metadata** and the QR modal.
4. Keep the narrative: “This is a real protocol—127-byte payloads, Arweave blobs, Polygon anchors. The example chain is on mainnet; you can verify it anytime.”
