# Run Event 1 flow: Genesis → Supports → Blob → Event 1 Anchor

Run these from the **ChainRoute repo root**. Have your **Ledger Stax** connected and unlocked (Ethereum app open, Blind signing enabled). Arweave key: `keys/arweave-keyfile-DNRLpCNPz-Gx6Pt80x-4vdx4oXMHQmlIXW9L04FhRkc.json`.

---

## Ledger paths (same seed, 7 sequential accounts)

The 7 EVM addresses in `keys/EVMaddresses.txt` are derived from the same Ledger seed in order. Use the path below so the correct account signs each step. (Scripts resolve `44'/60'/0'/0/n` to Ledger Live account path `44'/60'/n'/0/0`.)

| Step            | Signer              | Ledger path           |
|-----------------|---------------------|------------------------|
| Genesis         | Sébastien Moreau    | `44'/60'/0'/0/0`       |
| Event 1         | Dr. Elena Vasquez   | `44'/60'/0'/0/1`       |
| Event 2         | Marcus Webb         | `44'/60'/0'/0/2`       |
| Event 3         | Victoria Chen       | `44'/60'/0'/0/3`       |
| Event 4         | James Okonkwo       | `44'/60'/0'/0/4`       |
| Event 5         | Marcus Webb         | `44'/60'/0'/0/5`       |
| Event 6         | Dame Eleanor Ashford| `44'/60'/0'/0/6`       |

To confirm which address a path gives:  
`node docs/code/show-ledger-address.js --ledger-path "44'/60'/0'/0/0"` (change the last number for 1–6).

---

## Step 1: Post genesis Polygon transaction

Use **path 44'/60'/0'/0/0** so the first address (genesis signer) signs.

```bash
cd docs/code && node post-polygon-anchor.js \
  0000000000000000000000000000000000000000000000000000000000000000 \
  0000000000000000000000000000000000000000000000000000000000000000 \
  "" \
  0x8db69f820004eb12a01c7ede5e269e5561202512 \
  --key ledger --ledger-path "44'/60'/0'/0/0"
```

If the default RPC fails (e.g. gas station error), add `--rpc https://polygon-bor-rpc.publicnode.com`.

- **Sign on Ledger** when prompted.
- **Capture output:** the Polygon transaction hash (e.g. `0xabc...`).
- Set for next steps (use 64 hex **without** `0x` for genesis hash in Arweave/next Polygon):
  - `GENESIS_TX_HASH` = full hash (e.g. `0xabc...`)
  - `GENESIS_HASH` = same hash **without** `0x` (64 hex chars)

Example: if output is `0x1234...abcd`, then `GENESIS_HASH=1234...abcd` (64 hex, no 0x).

---

## Step 2: Post Event 1 supporting files to Arweave

Replace `<GENESIS_HASH>` with the 64-hex genesis hash from Step 1 (no `0x`).

```bash
ARWEAVE_KEY="keys/arweave-keyfile-DNRLpCNPz-Gx6Pt80x-4vdx4oXMHQmlIXW9L04FhRkc.json"

node docs/code/post-support-to-arweave.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/supports/UV_Analysis_Picasso_Hypothetical.png \
  --genesis <GENESIS_HASH> --key "$ARWEAVE_KEY"
# → Capture as ID_UV

node docs/code/post-support-to-arweave.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/supports/Spectral_Analysis_Report_v1.pdf \
  --genesis <GENESIS_HASH> --key "$ARWEAVE_KEY"
# → Capture as ID_SPECTRAL

node docs/code/post-support-to-arweave.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/supports/Notary_Seal_Paris.png \
  --genesis <GENESIS_HASH> --key "$ARWEAVE_KEY"
# → Capture as ID_NOTARY

node docs/code/post-support-to-arweave.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/supports/ArtSecure_Cert_12345.pdf \
  --genesis <GENESIS_HASH> --key "$ARWEAVE_KEY"
# → Capture as ID_ARTSECURE

node docs/code/post-support-to-arweave.js \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/supports/Fictional_Picasso.png \
  --genesis <GENESIS_HASH> --key "$ARWEAVE_KEY"
# → Capture as ID_FICTIONAL_PICASSO
```

Each command prints one 43-character Arweave transaction ID.

---

## Step 3: Create supports JSON and post Event 1 provenance blob

Create a file with the five support IDs (replace with your actual IDs):

```bash
# Replace the five IDs with the ones from Step 2
cat > /tmp/event1-supports.json << 'EOF'
[
  { "id": "<ID_UV>",                   "label": "UV_Analysis_Picasso_Hypothetical" },
  { "id": "<ID_SPECTRAL>",             "label": "Spectral_Analysis_Report_v1" },
  { "id": "<ID_NOTARY>",               "label": "Notary_Seal_Paris" },
  { "id": "<ID_ARTSECURE>",            "label": "ArtSecure_Cert_12345" },
  { "id": "<ID_FICTIONAL_PICASSO>",    "label": "Fictional_Picasso" }
]
EOF
```

Then post the blob (use same `<GENESIS_HASH>` as in Step 2):

```bash
node docs/code/post-provenance-blob-to-arweave.js \
  <GENESIS_HASH> \
  ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/1-authentication.json \
  --supports /tmp/event1-supports.json \
  --key keys/arweave-keyfile-DNRLpCNPz-Gx6Pt80x-4vdx4oXMHQmlIXW9L04FhRkc.json
```

- **Capture output:** the 43-character Arweave blob ID → `EVENT1_BLOB_ID`.

---

## Step 4: Post Event 1 Polygon transaction

Use:
- `GENESIS_HASH` = 64 hex (no 0x) from Step 1
- `GENESIS_TX_HASH` = same as genesis hash but in the format your script expects: **64 hex without 0x** (so same as GENESIS_HASH for “previous”)
- `EVENT1_BLOB_ID` = 43-char from Step 3
- Delegate = Event 2 signer: `0xab6cb77a629b56f5d9efd131404ebf692d4a7371`

Use **path 44'/60'/0'/0/1** so the second address (Event 1 signer) signs.

```bash
cd docs/code && node post-polygon-anchor.js \
  <GENESIS_HASH> \
  <GENESIS_TX_HASH> \
  <EVENT1_BLOB_ID> \
  0xab6cb77a629b56f5d9efd131404ebf692d4a7371 \
  --key ledger --ledger-path "44'/60'/0'/0/1"
```

- **Sign on Ledger** when prompted (account 2 = Event 1 signer).
- **Capture output:** Event 1 Polygon tx hash → use as `previousPolygonHash` for Event 2.

If the default RPC fails, add `--rpc https://polygon-bor-rpc.publicnode.com`.

---

## Verifying the chain

After posting, verify Polygon anchors and Arweave blobs (and support-file genesis tags):

```bash
node docs/code/verify-chain.js ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json
node docs/code/verify-support-tags.js ETHDenver2026Buidlathon/ChainRoute-Forge/Examples/HypotheticalPaintingRevised/chain-manifest.json
```

See [transaction-ids.md](./transaction-ids.md) for details and for Events 2–6.

---

## Summary of what to capture

| Step | Output variable   | Use |
|------|-------------------|-----|
| 1    | `GENESIS_HASH`    | 64 hex, no 0x — for all Arweave tags and payloads |
| 1    | `GENESIS_TX_HASH` | Same 64 hex — as `prevPolygonHash` for Event 1 |
| 2    | 5 × Arweave IDs   | Build `event1-supports.json` and blob |
| 3    | `EVENT1_BLOB_ID`  | 43 chars — for Event 1 Polygon payload |
| 4    | Event 1 tx hash   | Use as `previousPolygonHash` for Event 2 |
