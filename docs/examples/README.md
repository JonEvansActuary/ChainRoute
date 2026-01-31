# ChainRoute Examples

Example payloads for the [ChainRoute Protocol](../../protocol.md).

| Folder | Description |
|--------|-------------|
| [Arweave](./Arweave/) | Sample JSON blobs for Arweave main provenance events (genesis, creation, transfer, certification). |
| [Polygon](./Polygon/) | Sample JSON payloads for Polygon anchor transactions (genesis, first event, chained transfer); build the 127-byte `data` field from the JSON fields. |

For JavaScript helpers (build Polygon 127-byte payload, validate Arweave blob, post to Arweave/Polygon), see [docs/code](../code/). The scripts `build-polygon-payload.js` and `validate-arweave-blob.js` work without `npm install`.
