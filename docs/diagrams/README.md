# ChainRoute Diagrams

Visual overview of the [ChainRoute Protocol](../../protocol.md) structure and data flow.

| File | Description |
|------|-------------|
| [tree-structure.ascii.txt](./tree-structure.ascii.txt) | ASCII chain/tree: Genesis Polygon tx → events → Arweave blobs → supporting files. |
| [data-flow.ascii.txt](./data-flow.ascii.txt) | ASCII flow: posting an event (Arweave uploads → Polygon tx) and verification. |
| [tree-structure.jpeg](./tree-structure.jpeg) | Chain structure (Genesis → events → Arweave blobs → supporting files). |
| [data-flow.jpeg](./data-flow.jpeg) | Posting and verification flow. |

All nodes in the chain embed the same genesis hash; Polygon provides ordering and delegation, Arweave stores the data.
