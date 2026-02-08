# ChainRoute Examples

Example payloads for the [ChainRoute Protocol](../../protocol.md).

| Folder | Description |
|--------|-------------|
| [Arweave](./Arweave/) | Sample JSON blobs for Arweave main provenance events (genesis, creation, transfer, certification). |
| [Polygon](./Polygon/) | Sample JSON payloads for Polygon anchor transactions (genesis, first event, chained transfer); build the 127-byte `data` field from the JSON fields. |
| [test1](./test1/) | Mainnet test plan: live testing on Polygon and Arweave with hypothetical provenance data and supporting files. |
| [HypotheticaPainting](./HypotheticaPainting/) | Six-stage hypothetical provenance (authentication → transport → auction drop-off → sale → handover → storage) with event JSON and supporting file placeholders. |

For JavaScript helpers (build Polygon 127-byte payload, validate Arweave blob, post to Arweave/Polygon, Ledger Stax for Polygon signing), see [docs/code](../code/). The scripts `build-polygon-payload.js` and `validate-arweave-blob.js` work without `npm install`.
