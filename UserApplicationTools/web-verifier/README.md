# ChainRoute Web Verifier (Prototype)

Verify a ChainRoute provenance chain from **any single post**: Polygon anchor, event blob, support file, or genesis ID. No manifest required. Uses **backward walk** when you have an anchor tx (fast); **forward walk** when you have an Arweave ID or genesis hash.

## Quick start

```bash
cd UserApplicationTools/web-verifier
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Paste a Polygon tx hash, Arweave ID (event blob or support file), or 64-hex genesis hash—or a Polygonscan/Arweave URL—and click **Verify**.

## What it does

1. **Input:** You provide any of: **Polygon tx hash** (genesis or any event), **Arweave event blob ID** (43 chars), **Arweave support file ID** (43 chars), or **genesis hash** (64 hex).
2. **Resolve:** If Polygon anchor → use **backward walk** (follow prev hash to genesis; one fetch per step, fastest). If event blob → fetch blob, read `genesis`. If support file → Arweave GraphQL for `ChainRoute-Genesis` tag. If genesis hash → use as-is. For non-anchor inputs, run **forward walk** (see [FORWARD-WALK.md](FORWARD-WALK.md)): genesis tx → first delegate → search delegate’s txs with genesis in payload → order by prev → next delegate → repeat.
3. **Validate:** For each event, fetch the Arweave blob and check `genesis` match; set `blobOk` and `blobSummary`.
4. **Result:** **Verified** or **Invalid** badge, genesis hash, and timeline (Genesis → Event 1 → …) with links to Polygonscan and Arweave.

## Examples

- **Polygon anchor (fast path):** `0x647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc`
- **Genesis hash (64 hex):** `647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc`
- **Event blob ID:** e.g. `Eo-lBPPJmmuT__-oteZj61HDLPwCFqdGZZN5L2rPYGU` (HypotheticalPainting Event 1)
- **Support file ID:** any 43-char Arweave tx ID that has the `ChainRoute-Genesis` tag

You can also paste full URLs (Polygonscan, arweave.net, viewblock.io); the app extracts the hash or ID.

## API

**POST /api/verify**

- **Body:** `{ "input": "0x... | Arweave ID | 64-hex" }` (or `"txHash"` for backward compatibility).
- **Response:** `{ status, genesisHash, chain, errors }`
  - `status`: `"verified"` or `"invalid"`
  - `chain`: array of `{ step, txHash, delegate, arweaveId, blobOk, blobSummary }`
  - `errors`: list of strings if something failed

## Tech

- **Server:** Node 18+, Express, ethers.js. `lib/verify-from-tx.js` (backward), `lib/forward-walk.js` (forward), `lib/resolve-to-genesis.js` (input detection), `lib/enrich-blobs.js` (blob fetch).
- **Forward walk:** Uses Polygonscan API (`account&action=txlist`) to get txs by delegate address. Optional `POLYGONSCAN_API_KEY` for higher rate limits.
- **Env:** `PORT`, `POLYGON_RPC`, `ARWEAVE_GATEWAY`, `POLYGONSCAN_API_KEY` (optional).

## Related

- [Web Verifier concept](../concepts/01-web-verifier.md)
- [ChainRoute protocol](../../protocol.md)
- [docs/code verify-chain.js](../../docs/code/verify-chain.js) (manifest-based verification)
