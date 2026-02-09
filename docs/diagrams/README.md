# ChainRoute Diagrams

Graphical overview of the [ChainRoute Protocol](../../protocol.md): flowcharts, payload layout, and data structures so the protocol is easy to grasp at a glance.

## Diagrams (graphics)

| Diagram | What it shows |
|--------|----------------|
| [**data-flow.jpeg**](./data-flow.jpeg) | **Posting an event**: Support files → Arweave (support) → Main JSON blob → Arweave (main) → Polygon transaction. Includes the one-time genesis step. |
| [**tree-structure.jpeg**](./tree-structure.jpeg) | **Tree view**: Genesis as root (amber), event chain as trunk (blue), Arweave blobs as branches (green), support files as leaves (teal). Colorful, at-a-glance. |
| [**chain-structure.jpeg**](./chain-structure.jpeg) | **Chain layout**: Linear flow Genesis → Event 1 → Event 2 → … → Event N with links to blobs and supports. |
| [**payload-127.jpeg**](./payload-127.jpeg) | **127-byte Polygon payload**: The four segments (genesis hash, previous hash, Arweave ID, delegate) and the “genesis = zeros” note. |
| [**verification.jpeg**](./verification.jpeg) | **Verification flow**: From any tx or URL → extract genesis → query Polygon and fetch Arweave → traverse chain and validate blobs/supports. Optional manifest path. |
| [**blob-structure.jpeg**](./blob-structure.jpeg) | **Arweave data**: Main provenance blob (JSON fields) and support files with the ChainRoute-Genesis tag. |

All diagrams use a simple, consistent style (boxes, arrows, clear labels) and are intended for docs and slides.

## Optional: ASCII sources

The `.ascii.txt` files in this folder are text-only versions of the same concepts (flow, chain, payload, verification, blob structure). They are useful for terminals or when you prefer to edit the description in plain text. The **JPEGs above are the primary diagrams** and are not generated from the ASCII files.

## Archive

Older or superseded assets are in [Archive/](./Archive/).
