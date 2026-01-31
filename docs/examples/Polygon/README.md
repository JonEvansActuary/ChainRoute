# ChainRoute Polygon Transaction Examples

Example **127-byte payloads** for the [ChainRoute Protocol](../../../protocol.md) Polygon anchor transactions. Each payload goes in the transaction `data` field (raw bytes, no ABI encoding). All values are big-endian with no separators.

## Payload layout (127 bytes)

| Offset (bytes) | Field | Size | Description |
|----------------|--------|------|-------------|
| 0–31 | Genesis Hash | 32 | SHA-256 of the genesis Polygon tx (32 zeros only in the genesis tx itself). |
| 32–63 | Previous Polygon Hash | 32 | Hash of the prior Polygon tx in the chain (32 zeros for the first event after genesis). |
| 64–106 | Arweave ID | 43 | Full Arweave tx ID of the main provenance blob (43 bytes UTF-8 of the 43-character base64url string). Use null or empty in JSON for genesis (encoded as 43 zero bytes). |
| 107–126 | Delegate Address | 20 | Next authorized signer (raw 20-byte EVM address, no `0x`). |

Sign the transaction with the current delegate’s key; send to null or self for data-only txs.

## Example files

Each payload is a **JSON** object with `genesisHash` (64 hex), `previousPolygonHash` (64 hex), `arweaveId` (43-character string, or null/empty for genesis), and `delegate` (Ethereum-style `0x` + 40 hex). To build the 127-byte `data` field: encode genesis and prev as hex (32 bytes each), arweaveId as UTF-8 (43 bytes; use 43 zero bytes for genesis), delegate as hex without `0x` (20 bytes); concatenate and use `Buffer.from(...)` or equivalent.

| File | Description |
|------|-------------|
| `genesis-payload.json` | **Genesis tx.** Genesis = prev = 32 zero bytes; arweaveId = null (43 zero bytes); delegate = creator address. Broadcast this first; use its **transaction hash** as the chain’s genesis hash in all Arweave blobs and later Polygon payloads. |
| `first-event-payload.json` | **First event after genesis.** Genesis hash = genesis tx hash; prev = 32 zeros; arweaveId = 43-char Arweave blob tx ID; delegate = next signer. |
| `transfer-event-payload.json` | **Chained event (e.g. transfer).** Genesis hash = same; prev = hash of the Polygon tx that posted the previous event; arweaveId = blob for this event; delegate = new signer. |
