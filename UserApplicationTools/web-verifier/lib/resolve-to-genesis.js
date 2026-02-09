/**
 * Resolve any single input (Polygon anchor, event blob ID, support file ID, or genesis hash)
 * to either "use backward walk with this anchor" or "use forward walk with this genesis hash".
 */

const ARWEAVE_ID_REGEX = /^[A-Za-z0-9_-]{43}$/;
const GENESIS_HEX_REGEX = /^[0-9a-fA-F]{64}$/;
const POLYGON_TX_REGEX = /^0x[0-9a-fA-F]{64}$/;

/**
 * @param {string} input - User input: Polygon tx hash, Arweave ID (43 char), or 64-hex genesis hash
 * @param {{ arweaveGateway?: string }} opts
 * @returns {Promise<{ useBackward: true, anchorTxHash: string } | { useBackward: false, genesisHash: string } | { error: string }>}
 */
export async function resolveInput(input, opts = {}) {
  const s = (input || '').trim();
  const gateway = (opts.arweaveGateway || 'https://arweave.net').replace(/\/$/, '');
  const graphqlUrl = gateway + '/graphql';

  // Polygon anchor (0x + 64 hex) → backward walk (quick path)
  if (POLYGON_TX_REGEX.test(s)) {
    return { useBackward: true, anchorTxHash: s };
  }

  // 64 hex without 0x → genesis hash → forward walk
  if (s.length === 64 && GENESIS_HEX_REGEX.test(s)) {
    return { useBackward: false, genesisHash: s.toLowerCase() };
  }

  // Arweave ID (43 char) → fetch blob or GraphQL tags
  if (s.length === 43 && ARWEAVE_ID_REGEX.test(s)) {
    try {
      const res = await fetch(`${gateway}/${s}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const blob = await res.json();
          if (blob && typeof blob.genesis === 'string' && /^[0-9a-fA-F]{64}$/.test(blob.genesis)) {
            return { useBackward: false, genesisHash: blob.genesis.toLowerCase() };
          }
        }
      }
    } catch (_) {}

    try {
      const query = `query { transactions(ids: ["${s}"], first: 1) { edges { node { id tags { name value } } } } }`;
      const gres = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (gres.ok) {
        const json = await gres.json();
        const edges = json?.data?.transactions?.edges;
        if (edges && edges.length > 0) {
          const tags = (edges[0].node.tags || []).map((t) => ({ name: String(t.name || ''), value: String(t.value || '') }));
          const genesisTag = tags.find((t) => t.name === 'ChainRoute-Genesis');
          if (genesisTag && /^[0-9a-fA-F]{64}$/.test(genesisTag.value)) {
            return { useBackward: false, genesisHash: genesisTag.value.toLowerCase() };
          }
        }
      }
    } catch (_) {}

    return { error: 'Arweave ID: not an event blob (no genesis) and no ChainRoute-Genesis tag' };
  }

  return { error: 'Unrecognized input: use Polygon tx hash (0x+64 hex), Arweave ID (43 chars), or genesis hash (64 hex)' };
}
