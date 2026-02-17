# ChainRoute-Forge – Submission Checklist (ETHDenver 2026)

Use this with [TODO.md](./TODO.md) and [SuggestedImprovements.txt](./SuggestedImprovements.txt). All four code recommendations are implemented in the app.

## Code (done)

- **Ledger Stax cold signing** – GenesisWizard: toggle Ledger, Use Ledger, path `44'/60'/0'/0/0`. See `lib/chainroute/ledger-sign.ts`.
- **One-click NFT metadata export** – Chain viewer: “Export NFT metadata” button (ERC-721–style JSON).
- **Load Example Chain** – Verify page: “Load Example Chain” (HypotheticalPainting, Polygon mainnet).
- **QR** – Home, Verify (after valid result), and Chain viewer: “Show QR” / “QR code” for verifier link.

## Before submission (you do)

1. **Record 90-second Loom** – Follow [ChainRoute-Forge/DEMO-SCRIPT.md](./ChainRoute-Forge/DEMO-SCRIPT.md): Connect → genesis (Ledger option) → supports + event → anchor → View chain → NFT export → Verify → Load Example → QR.
2. **Export one-pager to PDF** – From [ChainRoute-Forge/ONE-PAGER.md](./ChainRoute-Forge/ONE-PAGER.md). Replace `[Deploy URL]` with your live Vercel URL first.
3. **Print 5× QR cards** – Link to your deployed Verify page (or Load Example Chain). Use for table/judging.
4. **Submit on Devfolio** – ETHERSPACE primary; bounties: Polygon (Amoy), Arweave, Base. Attach Loom + one-pager PDF.

Detailed step-by-step instructions are in [TODO.md](./TODO.md) (Detailed step-by-step instructions section).
