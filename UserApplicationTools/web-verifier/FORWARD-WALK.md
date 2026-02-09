# Forward walk: from any post to full chain

You can get the full ChainRoute chain (all Polygon anchors, event blobs, and support file IDs) from **any single post**: a Polygon anchor, an event blob, or a supporting file. It also works if you only have the **genesis ID** (the 64-hex genesis hash or the genesis Polygon tx hash). In every case you first **resolve to the genesis hash**, then run the same **forward walk** delegate by delegate. No global index or block scan is required.

**When you have an anchor tx hash:** Walk **backward** (follow prev hash to genesis) is quicker and more efficient—one tx fetch per step, no need to search by delegate or order. Use forward walk when your entry point is an event blob, a support file, or the genesis ID; use backward walk when you already have any Polygon anchor ID and only need to verify.

## Resolving to genesis from any post

| Entry point | How to get genesis hash |
|-------------|--------------------------|
| **Polygon anchor** (any tx in the chain) | Fetch tx, decode 127-byte payload. First 32 bytes = genesis hash (or, if this is the genesis tx, the tx hash itself is the genesis hash). |
| **Event blob** (Arweave ID of main JSON) | Fetch blob from Arweave; `blob.genesis` is the genesis hash. |
| **Supporting file** (Arweave ID) | Query Arweave (e.g. GraphQL) for that tx’s tags; `ChainRoute-Genesis` tag value = genesis hash. |
| **Genesis ID** | If you have the 64-hex genesis hash, you’re done. The genesis Polygon tx hash is `0x` + that value. If you have the genesis Polygon tx hash, the genesis hash is that value without `0x`. |

Once you have the genesis hash, the genesis Polygon tx is `0x` + genesis hash (same value). Fetch it and run the forward walk below.

## Forward walk (from genesis hash)

1. **Genesis anchor.**  
   Fetch the genesis Polygon tx (hash = `0x` + genesis hash). Its 127-byte payload has 32 zero bytes, 32 zero bytes, 43 zero bytes, and the **first delegate** (20-byte address). Record the delegate.

2. **Current delegate’s anchors.**  
   Search **transactions sent by the current delegate** (e.g. “from” = delegate). Keep only txs whose `data` is 0x + 254 hex chars (127 bytes) and whose first 32 bytes (after 0x) equal the genesis hash. Decode each payload (genesis, prev, arweaveId, nextDelegate).

3. **Order by previous hash.**  
   Build the ordered sub-chain for this delegate: the anchor with `prevHash` = genesis (or 32 zeros) is first; then the anchor with `prevHash` = first anchor’s tx hash; then the one with `prevHash` = second’s tx hash; … until you have a linear sequence. The **last** anchor in this sequence has the **next delegate** in its payload.

4. **Repeat.**  
   Set current delegate = next delegate. Go to step 2. Stop when the “next delegate” is unchanged (or you have no more txs), or when you have collected the full chain you need.

5. **Result.**  
   Full ordered list of Polygon anchors (genesis + Event 1, Event 2, …). Each non-genesis anchor’s payload contains an Arweave event blob ID. Fetch each blob; the blob’s `supports[]` array lists the Arweave IDs of supporting files for that event.

## Data needed

- **RPC or API:** “List transactions from address” (the delegate). Polygonscan API and many RPC providers support this.
- **Filter:** `data.length === 2 + 254` and first 32 bytes of `data` (after 0x) = genesis hash.
- **Decode:** 127-byte layout (genesis 32, prev 32, arweaveId 43, delegate 20).
