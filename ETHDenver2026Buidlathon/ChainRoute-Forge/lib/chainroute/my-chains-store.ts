/**
 * Local storage for tracking ChainRoute chains created by the current user.
 */

const STORAGE_KEY = "chainroute-my-chains";

export interface StoredChain {
  genesisHash: string;
  genesisTxHash: string;
  events: { txHash: string; timestamp: number }[];
  delegate: string;
  createdAt: number;
}

function getAll(): Record<string, StoredChain> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(chains: Record<string, StoredChain>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chains));
}

/** Save a new genesis chain. */
export function saveGenesis(genesisHash: string, genesisTxHash: string, delegate: string) {
  const chains = getAll();
  chains[genesisHash] = {
    genesisHash,
    genesisTxHash,
    events: [],
    delegate,
    createdAt: Date.now(),
  };
  saveAll(chains);
}

/** Add an event to an existing chain. */
export function addEvent(genesisHash: string, txHash: string, delegate: string) {
  const chains = getAll();
  const chain = chains[genesisHash];
  if (chain) {
    chain.events.push({ txHash, timestamp: Date.now() });
    chain.delegate = delegate;
    saveAll(chains);
  }
}

/** Import a chain discovered via verification (won't overwrite existing). */
export function importChain(genesisHash: string, genesisTxHash: string, delegate: string) {
  const chains = getAll();
  if (chains[genesisHash]) return; // already tracked
  chains[genesisHash] = {
    genesisHash,
    genesisTxHash,
    events: [],
    delegate,
    createdAt: Date.now(),
  };
  saveAll(chains);
}

/** Get all stored chains, sorted newest first. */
export function getMyChains(): StoredChain[] {
  const chains = getAll();
  return Object.values(chains).sort((a, b) => {
    const aLatest = a.events.length > 0 ? a.events[a.events.length - 1].timestamp : a.createdAt;
    const bLatest = b.events.length > 0 ? b.events[b.events.length - 1].timestamp : b.createdAt;
    return bLatest - aLatest;
  });
}
