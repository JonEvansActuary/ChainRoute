#!/usr/bin/env node
/**
 * Print the Ethereum/Polygon address for the Ledger at the given BIP32 path.
 * Use this to see which account will sign when you run post-polygon-anchor.js --key ledger.
 *
 * Path 44'/60'/0'/0/n is resolved to Ledger Live account path 44'/60'/n'/0/0 so signer 0..6
 * match keys/EVMaddresses.txt.
 *
 * Usage:
 *   node show-ledger-address.js [--ledger-path "44'/60'/0'/0/0"]
 *   node show-ledger-address.js --ledger-path "44'/60'/0'/0/1"
 */

const path = require('path');
const { resolveLedgerLivePath } = require('./polygon-ledger-sign.js');

const DEFAULT_PATH = process.env.POLYGON_LEDGER_PATH || "44'/60'/0'/0/0";

async function main() {
  const args = process.argv.slice(2);
  let ledgerPath = DEFAULT_PATH;
  const pathIdx = args.indexOf('--ledger-path');
  if (pathIdx !== -1 && args[pathIdx + 1]) {
    ledgerPath = args[pathIdx + 1];
  }

  const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
  const Eth = require('@ledgerhq/hw-app-eth').default;

  const transport = await TransportNodeHid.open();
  const eth = new Eth(transport);

  try {
    const { getLedgerAddress } = require('./polygon-ledger-sign.js');
    const resolved = resolveLedgerLivePath(ledgerPath);
    const address = await getLedgerAddress(eth, ledgerPath, 137);
    console.log('Ledger address for path', ledgerPath, '(resolved:', resolved + '):');
    console.log(address);
  } finally {
    await transport.close();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
