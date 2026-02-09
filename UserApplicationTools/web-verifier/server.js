/**
 * ChainRoute Web Verifier - prototype server.
 * Serves static frontend and POST /api/verify.
 * Accepts any single post: Polygon anchor (backward walk), event blob ID, support file ID, or genesis hash (forward walk).
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveInput } from './lib/resolve-to-genesis.js';
import { verifyFromTxHash } from './lib/verify-from-tx.js';
import { walkForward } from './lib/forward-walk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const opts = {
  rpcUrl: process.env.POLYGON_RPC || 'https://polygon-bor-rpc.publicnode.com',
  arweaveGateway: process.env.ARWEAVE_GATEWAY || 'https://arweave.net',
  polygonscanApiKey: process.env.POLYGONSCAN_API_KEY || undefined,
};

app.post('/api/verify', async (req, res) => {
  const raw = (req.body?.input ?? req.body?.txHash)?.trim();
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid input (or txHash)' });
  }

  try {
    const resolved = await resolveInput(raw, { arweaveGateway: opts.arweaveGateway });

    if (resolved.error) {
      return res.json({
        status: 'invalid',
        genesisHash: '',
        chain: [],
        errors: [resolved.error],
      });
    }

    let result;
    if (resolved.useBackward) {
      result = await verifyFromTxHash(resolved.anchorTxHash, opts);
    } else {
      result = await walkForward(resolved.genesisHash, opts);
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: 'invalid',
      genesisHash: '',
      chain: [],
      errors: [e.message],
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ChainRoute Web Verifier running at http://localhost:${PORT}`);
});
