# ChainRoute Example Events (Arweave)

Sample JSON blobs for the [ChainRoute Protocol](../../../protocol.md) Arweave main provenance format. Use these as references when building or validating event payloads.

| File | Event type | Description |
|------|------------|-------------|
| `genesis-event.json` | `creation` | First Arweave event in a chain. The `genesis` field must be the **Polygon transaction hash** of the genesis Polygon tx (the 127-byte data-only tx that started the chain), not zeros. That Polygon tx is posted first; its hash is then used in this blob and in all subsequent events. |
| `creation-event.json` | `creation` | Item creation/registration with existing genesis. |
| `transfer-event.json` | `transfer` | Ownership or custody transfer (from/to, item, description). |
| `certification-event.json` | `certification` | Authenticity or compliance certification. |

All samples conform to the recommended schema: `genesis`, `eventType`, `timestamp`, `summary`, and optional `supports` (Arweave tx IDs, 43 chars).
